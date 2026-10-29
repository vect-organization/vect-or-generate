// Copyright (c) 2026 1abcdefggs
// SPDX-License-Identifier: MIT
// ADR-0005 Phase5: kb_*.json (v0.3.0 entities[] / bare array, layer:n) -> schema v2 (concepts[] + forms[])
//
// Usage: node scripts/migrate-v1-to-v2.mjs <input.json> [output.json] [--lang=ja] [--scheme=<id>]
//
// Guarantees:
//  - Nothing is dropped: fields without a v2 home go to concept.legacy.
//  - concept ids are scheme-qualified (c:<scheme>:<localId>) per ADR-0005, not c:#001.
//  - `code` "ICD-10-CM: A00" -> notations[{scheme:"ICD-10-CM", value:"A00"}]; bare code -> scheme "unspecified".
//  - `layer:n` -> facet via registry/facets.json `legacy`; unmapped layers are kept + warned.
//  - `reading` moves to forms[] (F.form), linked through senses[].id.
//  - Embedding facet is resolved from the source model id via registry `modelId`
//    (falls back to F.embedding.e5small with a warning).
//  - Output schemaVersion "2.0-draft": mechanical migration, pending human review.

import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { loadFacetRegistry, findEmbeddingFacetByModelId } from '../core/registryLoader.mjs';
import { validateKnowledgeBaseV2 } from '../core/validator.mjs';

const DEFAULT_EMBEDDING_FACET = 'F.embedding.e5small';

function buildLayerToFacetMap() {
    const map = new Map();
    for (const [facetId, def] of Object.entries(loadFacetRegistry())) {
        if (!def.legacy) continue;
        for (const token of String(def.legacy).split('/')) {
            const m = token.trim().match(/^L(\d+)$/);
            if (!m) continue;
            const n = Number(m[1]);
            if (!map.has(n)) map.set(n, []);
            map.get(n).push(facetId);
        }
    }
    return map;
}

function splitCodeIntoNotation(code) {
    if (!code || typeof code !== 'string') return null;
    const m = code.match(/^\s*([^:]+):\s*(.+)$/);
    return m ? { scheme: m[1].trim(), value: m[2].trim() } : { scheme: 'unspecified', value: code.trim() };
}

function localIdOf(id, index) {
    const raw = id != null ? String(id) : String(index + 1);
    return raw.replace(/^#/, '').replace(/[^A-Za-z0-9_.-]/g, '_') || String(index + 1);
}

export function migrateEntityToConcept(entity, index, ctx) {
    const { scheme, lang, layerToFacetMap, embeddingFacet, warnings } = ctx;
    const localId = localIdOf(entity.id, index);
    const conceptId = `c:${scheme}:${localId}`;
    const senseId = `s:${scheme}:${localId}:1`;

    const notations = [];
    if (entity.id != null) notations.push({ scheme: 'legacy-id', value: String(entity.id) });
    const codeNotation = splitCodeIntoNotation(entity.code);
    if (codeNotation) notations.push(codeNotation);

    const src = entity.metadata && entity.metadata.source && typeof entity.metadata.source === 'object' ? entity.metadata.source : null;
    const labels = [];
    if (entity.name) {
        labels.push({
            kind: 'pref', lang, text: entity.name,
            ...(src ? { provenance: { source: src.title || src.type || 'unknown', ...(src.url ? { url: src.url } : {}), ...(src.retrieved_at ? { retrieved_at: src.retrieved_at } : {}) } } : {}),
        });
    }
    for (const syn of Array.isArray(entity.synonyms) ? entity.synonyms : []) labels.push({ kind: 'alt', lang, text: syn });

    const concept = {
        id: conceptId,
        notations,
        broader: null,
        depth: 0,
        labels,
        senses: [{ id: senseId, definition: entity.definition || entity.description || '' }],
        ...(entity.category ? { category: entity.category } : {}),
    };

    const legacy = {};
    if (typeof entity.layer === 'number') {
        const facets = layerToFacetMap.get(entity.layer);
        if (facets && facets.length) {
            concept.facet = facets[0];
            if (facets.length > 1) {
                concept.facetCandidates = facets;
                warnings.push(`${conceptId}: layer ${entity.layer} maps to ${facets.join('/')}; '${facets[0]}' chosen provisionally, needs review.`);
            }
        } else {
            concept.layer = entity.layer;
            warnings.push(`${conceptId}: layer ${entity.layer} has no facet mapping in registry/facets.json; kept as legacy 'layer'.`);
        }
    }
    if (entity.layerName) legacy.layerName = entity.layerName;
    if (entity.inEditor !== undefined) legacy.inEditor = entity.inEditor;
    if (src && src.raw_snippet) legacy.rawSnippet = src.raw_snippet;
    if (src && src.type && src.title) legacy.sourceType = src.type;

    if (Array.isArray(entity.vector) && entity.vector.length > 0) {
        concept.embeddings = [{ facet: embeddingFacet, dim: entity.vector.length, modality: 'text', normalized: true, vector: entity.vector }];
    }
    if (Object.keys(legacy).length) concept.legacy = legacy;

    const form = entity.reading || entity.name
        ? { id: `f:${scheme}:${localId}`, writtenForm: entity.name || '', ...(entity.reading ? { reading: [{ value: entity.reading }] } : {}), senses: [senseId] }
        : null;

    return { concept, form };
}

/**
 * @param {Object|Array} v1Doc - v0.3.0 compiled payload ({domain, entities}) or bare runtime array
 * @param {Object} [options]
 * @param {string} [options.lang='und'] - BCP-47 tag for labels (v0.3.0 has no language field; 'und' = undetermined)
 * @param {string} [options.scheme] - concept id scheme (defaults to domain)
 * @param {string} [options.modelId] - embedding model the vectors came from (defaults to config/defaultModel if known)
 */
export function migrateKbV1ToV2(v1Doc, options = {}) {
    const warnings = [];
    const isArray = Array.isArray(v1Doc);
    const entities = isArray ? v1Doc : (Array.isArray(v1Doc?.entities) ? v1Doc.entities : []);
    const domain = (!isArray && v1Doc?.domain) || options.domain || 'general';
    const scheme = (options.scheme || domain).replace(/[^A-Za-z0-9_.-]/g, '_');
    const lang = options.lang || 'und';
    if (!options.lang) warnings.push(`labels.lang not specified; using 'und'. Pass --lang=ja|en to set it.`);

    let embeddingFacet = findEmbeddingFacetByModelId(options.modelId);
    if (!embeddingFacet) {
        embeddingFacet = DEFAULT_EMBEDDING_FACET;
        if (entities.some(e => Array.isArray(e.vector) && e.vector.length)) {
            warnings.push(`embedding model unknown; vectors labelled '${DEFAULT_EMBEDDING_FACET}'. Pass --model=<id> if another model produced them.`);
        }
    }
    const regDim = loadFacetRegistry()[embeddingFacet]?.dim;
    const dims = new Set(entities.filter(e => Array.isArray(e.vector) && e.vector.length).map(e => e.vector.length));
    if (dims.size > 1) warnings.push(`mixed vector dimensions in source: ${[...dims].join(', ')}`);
    for (const d of dims) if (regDim && d !== regDim) warnings.push(`vector dim ${d} != registry dim ${regDim} for ${embeddingFacet}`);

    const ctx = { scheme, lang, layerToFacetMap: buildLayerToFacetMap(), embeddingFacet, warnings };
    const concepts = [];
    const forms = [];
    entities.forEach((e, i) => {
        const { concept, form } = migrateEntityToConcept(e, i, ctx);
        concepts.push(concept);
        if (form) forms.push(form);
    });

    const v2Doc = {
        domain,
        schemaVersion: '2.0-draft',
        ...(!isArray && v1Doc.prefix ? { prefix: v1Doc.prefix } : {}),
        ...(!isArray && v1Doc.dimension ? { dimension: v1Doc.dimension } : {}),
        ...(!isArray && v1Doc.metric ? { metric: v1Doc.metric } : {}),
        ...(!isArray && v1Doc.is_sanitized !== undefined ? { is_sanitized: v1Doc.is_sanitized } : {}),
        ...(!isArray && v1Doc.fidelity_score !== undefined ? { fidelity_score: v1Doc.fidelity_score } : {}),
        source: { provenance: `migrated from v0.3.0 (${isArray ? 'runtime array' : (v1Doc.schemaVersion || v1Doc.version || 'unknown')})` },
        forms,
        concepts,
    };

    const check = validateKnowledgeBaseV2(v2Doc);
    for (const e of check.errors) warnings.push(`validation error: ${e}`);
    return { v2Doc, warnings, valid: check.isValid };
}

// --- CLI ---
if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
    const args = process.argv.slice(2);
    const flags = Object.fromEntries(args.filter(a => a.startsWith('--')).map(a => a.slice(2).split('=')));
    const [inputPath, outputPath] = args.filter(a => !a.startsWith('--'));
    if (!inputPath) {
        console.error('Usage: node scripts/migrate-v1-to-v2.mjs <input.json> [output.json] [--lang=ja] [--scheme=id] [--model=Xenova/multilingual-e5-small]');
        process.exit(1);
    }
    const { v2Doc, warnings, valid } = migrateKbV1ToV2(JSON.parse(readFileSync(inputPath, 'utf-8')), {
        lang: flags.lang, scheme: flags.scheme, modelId: flags.model,
    });
    const out = outputPath || inputPath.replace(/\.json$/i, '.v2.json');
    writeFileSync(out, JSON.stringify(v2Doc, null, 2), 'utf-8');
    console.log(`Migrated ${v2Doc.concepts.length} entities -> concepts (${valid ? 'valid' : 'HAS ERRORS'}), wrote ${out}`);
    if (warnings.length) console.log(`${warnings.length} warning(s):\n  - ${warnings.join('\n  - ')}`);
    if (!valid) process.exitCode = 2;
}
