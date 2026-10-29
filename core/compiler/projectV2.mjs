// Copyright (c) 2026 1abcdefggs
// SPDX-License-Identifier: MIT
// Schema v2 (concepts[]) -> runtime item projection consumed by vect-or-engine
// (KnowledgeItem = flat { id, vector, ...metadata }) and vect-or-edit (slot items).
// ADR-0005: v2 is the authoring/exchange format; this projection is the single place
// that flattens it, so Edit/Engine never need to understand concepts[] directly.

/**
 * Accepts any supported KB payload shape and returns a flat item array.
 *  - Array                       -> returned as-is (legacy runtime format)
 *  - { entities: [...] }         -> entities (v0.3.0 compiled payload)
 *  - { concepts: [...] }         -> projected via projectConceptsToItems
 * @param {any} payload
 * @param {Object} [options] forwarded to projectConceptsToItems
 * @returns {{ items: Object[], format: 'array'|'entities'|'concepts'|'unknown', skipped: number, embeddingFacet: string|null }}
 */
export function normalizeKbPayload(payload, options = {}) {
    if (Array.isArray(payload)) return { items: payload, format: 'array', skipped: 0, embeddingFacet: null };
    if (payload && Array.isArray(payload.concepts)) {
        return { ...projectConceptsToItems(payload, options), format: 'concepts' };
    }
    if (payload && Array.isArray(payload.entities)) {
        return { items: payload.entities, format: 'entities', skipped: 0, embeddingFacet: null };
    }
    return { items: [], format: 'unknown', skipped: 0, embeddingFacet: null };
}

function firstCodeNotation(notations = []) {
    const n = notations.find(x => x.scheme && x.scheme !== 'legacy-id');
    return n ? `${n.scheme}: ${n.value}` : '';
}

/**
 * @param {Object} doc - schema v2 document
 * @param {Object} [options]
 * @param {string} [options.embeddingFacet] - facet id to project (e.g. 'F.embedding.e5small').
 *        Defaults to the first embedding facet found in the document.
 * @returns {{ items: Object[], skipped: number, embeddingFacet: string|null }}
 */
export function projectConceptsToItems(doc, options = {}) {
    const concepts = Array.isArray(doc?.concepts) ? doc.concepts : [];
    let facet = options.embeddingFacet || null;
    if (!facet) {
        for (const c of concepts) {
            const e = (c.embeddings || []).find(x => Array.isArray(x.vector) && x.vector.length > 0);
            if (e) { facet = e.facet; break; }
        }
    }

    // sense id -> reading (from forms[]), so F.form data is not lost in the flat view
    const readingBySense = new Map();
    for (const f of Array.isArray(doc?.forms) ? doc.forms : []) {
        const reading = Array.isArray(f.reading) && f.reading[0] ? f.reading[0].value : undefined;
        if (!reading) continue;
        for (const sid of f.senses || []) readingBySense.set(sid, reading);
    }

    const items = [];
    let skipped = 0;
    for (const c of concepts) {
        const emb = (c.embeddings || []).find(e => e.facet === facet && Array.isArray(e.vector) && e.vector.length > 0);
        if (!emb) { skipped++; continue; }
        const labels = c.labels || [];
        const pref = labels.find(l => l.kind === 'pref') || labels[0];
        const sense = (c.senses || [])[0];
        items.push({
            id: c.id,
            name: pref ? pref.text : c.id,
            reading: (sense && readingBySense.get(sense.id)) || '',
            definition: sense ? sense.definition : '',
            code: firstCodeNotation(c.notations),
            synonyms: labels.filter(l => l.kind === 'alt').map(l => l.text),
            category: c.category || '',
            facet: c.facet || 'F.concept',
            embeddingFacet: facet,
            ...(pref && pref.provenance ? { provenance: pref.provenance } : {}),
            vector: emb.vector,
        });
    }
    return { items, skipped, embeddingFacet: facet };
}
