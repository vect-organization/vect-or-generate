// Copyright (c) 2026 1abcdefggs
// SPDX-License-Identifier: MIT
// 10-Layer Semantic Architecture Registry & Normalization Helpers

export const SEMANTIC_LAYERS = {
    0: "L0 Raw String",
    1: "L1 Lemma / Orthography",
    2: "L2 Morph / POS",
    3: "L3 Syntax / Parsing",
    4: "L4 Semantic / Definition",
    5: "L5 Pragmatic / Context",
    6: "L6 High-dim Vector",
    7: "L7 Linter / Rule",
    8: "L8 Logic / Causal Graph",
    9: "L9 Skeleton / Blueprint"
};

/**
 * Normalizes an individual raw entity item into a standard 10-layer compliant object.
 * @param {Object} item - Raw entity item
 * @param {number} [index=0] - Fallback sequence index for ID generation
 * @returns {Object} Standardized 10-layer entity object
 */
export function normalizeEntity(item, index = 0) {
    if (!item || typeof item !== 'object') {
        throw new Error(`Invalid entity at index ${index}: expected an object`);
    }

    const { text_for_vector, description, ...cleanItem } = item;
    const layer = Number.isInteger(cleanItem.layer) ? cleanItem.layer : 4;
    const layerName = cleanItem.layerName || SEMANTIC_LAYERS[layer] || `L${layer} Custom`;

    return {
        id: cleanItem.id || `#${String(index + 1).padStart(2, '0')}`,
        name: cleanItem.name || '',
        reading: cleanItem.reading || '',
        definition: cleanItem.definition || description || '',
        layer,
        layerName,
        category: cleanItem.category || 'General',
        code: cleanItem.code || '',
        synonyms: Array.isArray(cleanItem.synonyms) ? cleanItem.synonyms : [],
        inEditor: cleanItem.inEditor !== undefined ? Boolean(cleanItem.inEditor) : true,
        metadata: cleanItem.metadata || { source: null },
        ...(cleanItem.vector ? { vector: cleanItem.vector } : {})
    };
}
