// Copyright (c) 2026 1abcdefggs
// SPDX-License-Identifier: MIT
// registry/facets.json loader (SSOT for F.* / P.* / G.* identifiers and open vocabularies).
// ADR-0005 Phase4.2. Uses a JSON import attribute instead of node:fs so the same module
// works in Node (CLI / tests) and in the Vite-built Studio (browser), matching how
// pipeline.mjs already imports config.json.

import registry from '../registry/facets.json' with { type: 'json' };

const FACETS = registry.facets || {};
const VOCABULARIES = registry.vocabularies || {};

export function loadFacetRegistry() {
    return FACETS;
}

/** Returns true if facetId is registered (F.x / P.x / G.x). */
export function isRegisteredFacet(facetId) {
    return typeof facetId === 'string' && Object.prototype.hasOwnProperty.call(FACETS, facetId);
}

/** Open, registry-driven vocabularies (relation types, external sources, ...). */
export function isInVocabulary(name, value) {
    const list = VOCABULARIES[name];
    return Array.isArray(list) && list.includes(value);
}

/** Resolve an embedding facet from a model id (e.g. 'Xenova/multilingual-e5-small'). */
export function findEmbeddingFacetByModelId(modelId) {
    if (!modelId) return null;
    const short = String(modelId).split('/').pop();
    for (const [id, def] of Object.entries(FACETS)) {
        if (!id.startsWith('F.embedding.') || !def.modelId) continue;
        if (def.modelId === modelId || String(def.modelId).split('/').pop() === short) return id;
    }
    return null;
}

/**
 * Legacy layer numbers that still map to a facet (derived from each facet's `legacy`
 * field, e.g. "L4/L5/L8"), replacing the old hardcoded 0-9 bound.
 */
export function loadLegacyLayerSet() {
    const layers = new Set();
    for (const def of Object.values(FACETS)) {
        if (!def.legacy) continue;
        for (const token of String(def.legacy).split('/')) {
            const m = token.trim().match(/^L(\d+)$/);
            if (m) layers.add(Number(m[1]));
        }
    }
    return layers;
}
