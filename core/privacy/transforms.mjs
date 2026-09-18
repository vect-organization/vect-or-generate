// Copyright (c) 2026 1abcdefggs
// SPDX-License-Identifier: MIT
// Entity Privacy Transformations (Provenance Stripping, ID Shuffling, Syntactic Anonymization)

/**
 * Strips all provenance metadata (source URLs, source files, raw snippets) from entities.
 * @param {Array<Object>} entities 
 * @returns {Array<Object>}
 */
export function stripProvenance(entities) {
    if (!Array.isArray(entities)) return [];
    return entities.map(item => {
        const cleanItem = { ...item };
        if (cleanItem.metadata) {
            const { source, source_file, url, raw_snippet, ...safeMeta } = cleanItem.metadata;
            cleanItem.metadata = { ...safeMeta, source: null };
        } else {
            cleanItem.metadata = { source: null };
        }
        delete cleanItem.provenance;
        return cleanItem;
    });
}

/**
 * Shuffles entity order and reassigns anonymized sequential IDs.
 * @param {Array<Object>} entities 
 * @param {string} [prefix='#']
 * @returns {Array<Object>}
 */
export function shuffleIdentifiers(entities, prefix = '#') {
    if (!Array.isArray(entities)) return [];
    const array = [...entities];
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array.map((item, idx) => ({
        ...item,
        id: `${prefix}${String(idx + 1).padStart(2, '0')}`
    }));
}

/**
 * Applies syntactic anonymization / de-identification to definition strings.
 * @param {Array<Object>} entities 
 * @param {string} [tag='[Sanitized via Paraphrase]'] 
 * @returns {Array<Object>}
 */
export function anonymizeSyntax(entities, tag = '[Sanitized via Paraphrase]') {
    if (!Array.isArray(entities)) return [];
    return entities.map(item => {
        const def = item.definition || item.description || '';
        if (def.includes(tag)) {
            return item;
        }
        return {
            ...item,
            definition: `${tag} ${def}`.trim()
        };
    });
}
