// Copyright (c) 2026 1abcdefggs
// SPDX-License-Identifier: MIT
// IME TSV Dictionary Generator (Compatible with MS-IME, Google Japanese Input, macOS IME)

/**
 * Generates a 4-column TSV dictionary for OS-level and in-editor IME typing suggestions.
 * Format: reading \t name \t pos_layer \t definition_comment
 * 
 * @param {Array<Object>} entities 
 * @returns {string} Formatted TSV dictionary text
 */
export function generateImeDictionary(entities) {
    if (!Array.isArray(entities)) return '';

    const lines = [];
    for (const item of entities) {
        if (!item.name) continue;

        const reading = (item.reading || item.name || '').trim();
        const name = (item.name || '').trim();
        const layerInfo = item.layerName || `L${item.layer ?? 4} Semantic`;
        const pos = item.category ? `Noun/${item.category} (${layerInfo})` : `Noun (${layerInfo})`;
        const comment = (item.definition || item.description || '').replace(/[\r\n\t]/g, ' ').trim();

        lines.push(`${reading}\t${name}\t${pos}\t${comment}`);
    }

    return lines.join('\n') + '\n';
}
