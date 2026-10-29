// Copyright (c) 2026 1abcdefggs
// SPDX-License-Identifier: MIT
// Schema v2 (concepts[]) embedding pass: attaches concepts[].embeddings[] to a vector-less v2 document.
// Counterpart of projectV2.mjs (which reads them); the document stays v2, nothing is flattened here.

import config from '../../config.json' with { type: 'json' };
import { validateKnowledgeBaseV2 } from '../validator.mjs';
import { findEmbeddingFacetByModelId, loadFacetRegistry } from '../registryLoader.mjs';

/** True when the payload is a schema v2 document (concepts[]). */
export function isV2Document(payload) {
    return !!payload && !Array.isArray(payload) && Array.isArray(payload.concepts);
}

/**
 * Text that represents a concept in vector space: preferred and alternative labels (all languages),
 * then the first sense definition. Stubs (structure-only placeholders) have no meaning of their own.
 * @returns {string} empty when the concept should not be embedded
 */
export function conceptTextForVector(concept) {
    if (concept.stub) return '';
    const labels = Array.isArray(concept.labels) ? concept.labels : [];
    const parts = [];
    for (const l of labels) {
        if (l && typeof l.text === 'string' && l.text.trim() && !parts.includes(l.text.trim())) parts.push(l.text.trim());
    }
    if (parts.length === 0) return '';
    const sense = Array.isArray(concept.senses) ? concept.senses[0] : null;
    if (sense && typeof sense.definition === 'string' && sense.definition.trim()) parts.push(sense.definition.trim());
    return parts.join(' / ');
}

/**
 * Adds one embedding per embeddable concept for the facet that matches the model. Existing embeddings of the
 * same facet are replaced; other facets are kept. The input document is not mutated.
 *
 * @param {Object} doc - schema v2 document
 * @param {Object} [options]
 * @param {string} [options.modelName=config.defaultModel]
 * @param {Function} [options.embedder] - (texts: string[], modelName) => Promise<number[][]>
 * @param {Function} [options.onProgress] - (current, total, concept)
 * @returns {Promise<{ doc: Object, embedded: number, skipped: number, facet: string, warnings: string[] }>}
 */
export async function embedConceptsV2(doc, options = {}) {
    const { modelName = config.defaultModel, embedder = null, onProgress = null } = options;
    if (!isV2Document(doc)) throw new Error('Invalid input: expected a schema v2 document with a concepts array');

    const facet = findEmbeddingFacetByModelId(modelName);
    if (!facet) throw new Error(`Model has no embedding facet in registry/facets.json: ${modelName}`);
    const dim = loadFacetRegistry()[facet].dim;

    const embed = embedder || (await import('../embedder.mjs')).embedPassages;

    const targets = [];
    for (const c of doc.concepts) {
        const text = conceptTextForVector(c);
        if (text) targets.push({ concept: c, text });
    }

    const vectors = [];
    const CHUNK = 32;
    for (let start = 0; start < targets.length; start += CHUNK) {
        const chunk = targets.slice(start, start + CHUNK);
        const out = await embed(chunk.map(t => t.text), modelName);
        if (!Array.isArray(out) || out.length !== chunk.length) throw new Error('Embedder returned a different number of vectors than texts');
        vectors.push(...out);
        if (onProgress) onProgress(Math.min(start + CHUNK, targets.length), targets.length, chunk[chunk.length - 1].concept);
    }

    const byId = new Map(targets.map((t, i) => [t.concept.id, vectors[i]]));
    const concepts = doc.concepts.map(c => {
        const vector = byId.get(c.id);
        if (!vector) return c;
        const kept = (c.embeddings || []).filter(e => e.facet !== facet);
        return { ...c, embeddings: [...kept, { facet, dim: vector.length, modality: 'text', normalized: true, vector }] };
    });

    const result = { ...doc, concepts };
    const check = validateKnowledgeBaseV2(result);
    if (!check.isValid) throw new Error(`Embedded v2 document failed validation:\n  - ${check.errors.slice(0, 5).join('\n  - ')}`);
    const warnings = [...check.warnings];
    if (targets.length && vectors[0].length !== dim) warnings.push(`vector length ${vectors[0].length} != registry dim ${dim} for ${facet}`);

    return { doc: result, embedded: targets.length, skipped: doc.concepts.length - targets.length, facet, warnings };
}
