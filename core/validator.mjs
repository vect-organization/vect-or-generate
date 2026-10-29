// Copyright (c) 2026 1abcdefggs
// SPDX-License-Identifier: MIT
// https://github.com/1abcdefggs/vect-or-generate
// ADR-0005 Phase4.2: numeric layer bound replaced by registry/facets.json lookup.

import { isRegisteredFacet, loadLegacyLayerSet, loadFacetRegistry, isInVocabulary } from './registryLoader.mjs';

/**
 * Validates raw data array or wrapped object against the 10-layer Semantic Base Specification.
 * @param {any} data - Parsed JSON object or array
 * @returns {{ isValid: boolean, errors: string[], count: number, domain?: string }}
 */
export function validateRawData(data) {
    const errors = [];
    let entities = data;
    let domain = 'custom_domain';

    if (data && typeof data === 'object' && !Array.isArray(data)) {
        if (Array.isArray(data.entities)) {
            entities = data.entities;
            domain = data.domain || domain;
        } else {
            return {
                isValid: false,
                errors: ["Wrapped JSON object must contain an 'entities' array."],
                count: 0
            };
        }
    }

    if (!Array.isArray(entities)) {
        return {
            isValid: false,
            errors: [`Input data must be a JSON array or a wrapped object with 'entities'. Received: ${typeof entities}`],
            count: 0
        };
    }

    if (entities.length === 0) {
        return {
            isValid: false,
            errors: ['Input data array is empty. At least one item is required.'],
            count: 0
        };
    }

    entities.forEach((item, index) => {
        if (!item || typeof item !== 'object') {
            errors.push(`Item #${index}: Must be a JSON object.`);
            return;
        }
        if (!item.id || typeof item.id !== 'string' || item.id.trim() === '') {
            errors.push(`Item #${index}: Missing or empty required field 'id' (string).`);
        }

        const hasTextForVector = typeof item.text_for_vector === 'string' && item.text_for_vector.trim() !== '';
        const hasNameAndDef = typeof item.name === 'string' && item.name.trim() !== '';
        if (!hasTextForVector && !hasNameAndDef) {
            errors.push(`Item #${index} (id: ${item.id || 'N/A'}): Must provide either 'text_for_vector' or 'name'.`);
        }

        // schemaVersion "2.0-draft": facet is the primary identifier (F.*/P.*/G.*).
        if (item.facet !== undefined) {
            if (typeof item.facet !== 'string' || !isRegisteredFacet(item.facet)) {
                errors.push(`Item #${index} (id: ${item.id || 'N/A'}): 'facet' is not registered in registry/facets.json: ${item.facet}`);
            }
        } else if (item.layer !== undefined) {
            // legacy compatibility view: layer number must map to a facet's `legacy` field.
            const legacyLayers = loadLegacyLayerSet();
            if (typeof item.layer !== 'number' || !legacyLayers.has(item.layer)) {
                errors.push(`Item #${index} (id: ${item.id || 'N/A'}): 'layer' (${item.layer}) has no facet mapping in registry/facets.json (legacy field).`);
            }
        }
    });

    return {
        isValid: errors.length === 0,
        errors,
        count: entities.length,
        domain
    };
}

/**
 * Semantic checks for schema v2 documents that JSON Schema cannot express (ADR-0005):
 * registry membership (facets / open vocabularies), referential integrity of concept ids,
 * and embedding dimension vs. registry. Errors block; warnings (dangling refs) do not.
 * @param {Object} doc - schema v2 document ({ concepts[], forms? })
 * @returns {{ isValid: boolean, errors: string[], warnings: string[] }}
 */
export function validateKnowledgeBaseV2(doc) {
    const errors = [];
    const warnings = [];
    const concepts = Array.isArray(doc?.concepts) ? doc.concepts : [];
    const facets = loadFacetRegistry();

    const conceptIds = new Set();
    const senseIds = new Set();
    for (const c of concepts) {
        if (conceptIds.has(c.id)) errors.push(`duplicate concept id: ${c.id}`);
        conceptIds.add(c.id);
        for (const s of c.senses || []) senseIds.add(s.id);
    }

    for (const c of concepts) {
        if (c.facet !== undefined && !isRegisteredFacet(c.facet)) {
            errors.push(`${c.id}: facet not registered: ${c.facet}`);
        }
        for (const fc of c.facetCandidates || []) {
            if (!isRegisteredFacet(fc)) errors.push(`${c.id}: facetCandidate not registered: ${fc}`);
        }
        for (const b of c.broader || []) {
            if (!conceptIds.has(b)) warnings.push(`${c.id}: broader target not in this document: ${b}`);
        }
        for (const r of c.relations || []) {
            if (!isInVocabulary('relationTypes', r.type)) errors.push(`${c.id}: relation type not in registry vocabularies.relationTypes: ${r.type}`);
            if (r.source && r.source !== 'internal' && !isInVocabulary('externalSources', r.source)) {
                errors.push(`${c.id}: relation source not in registry vocabularies.externalSources: ${r.source}`);
            }
            if (!r.source || r.source === 'internal') {
                if (!conceptIds.has(r.target)) warnings.push(`${c.id}: internal relation target not in this document: ${r.target}`);
            }
        }
        for (const a of c.externalAlignment || []) {
            if (!isInVocabulary('externalSources', a.source)) errors.push(`${c.id}: externalAlignment source not in registry: ${a.source}`);
        }
        for (const e of c.embeddings || []) {
            const def = facets[e.facet];
            if (!def) { errors.push(`${c.id}: embedding facet not registered: ${e.facet}`); continue; }
            const len = Array.isArray(e.vector) ? e.vector.length : null;
            if (len !== null && e.dim != null && len !== e.dim) errors.push(`${c.id}: embedding dim field (${e.dim}) != vector length (${len})`);
            if (len !== null && def.dim != null && len !== def.dim) warnings.push(`${c.id}: vector length ${len} != registry dim ${def.dim} for ${e.facet}`);
        }
    }

    for (const f of Array.isArray(doc?.forms) ? doc.forms : []) {
        for (const sid of f.senses || []) {
            if (!senseIds.has(sid)) errors.push(`form ${f.id}: sense id not found in concepts[].senses[]: ${sid}`);
        }
    }

    return { isValid: errors.length === 0, errors, warnings };
}
