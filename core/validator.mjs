// Copyright (c) 2026 1abcdefggs
// SPDX-License-Identifier: MIT
// https://github.com/1abcdefggs/vect-or-generate

/**
 * Validates raw data array against the 10-layer Semantic Base Specification.
 * @param {any} data - Parsed JSON object or array
 * @returns {{ isValid: boolean, errors: string[], count: number }}
 */
export function validateRawData(data) {
    const errors = [];

    if (!Array.isArray(data)) {
        return {
            isValid: false,
            errors: [`Input data must be a JSON array of objects. Received: ${typeof data}`],
            count: 0
        };
    }

    if (data.length === 0) {
        return {
            isValid: false,
            errors: ['Input data array is empty. At least one item is required.'],
            count: 0
        };
    }

    data.forEach((item, index) => {
        if (!item || typeof item !== 'object') {
            errors.push(`Item #${index}: Must be a JSON object.`);
            return;
        }
        if (!item.id || typeof item.id !== 'string' || item.id.trim() === '') {
            errors.push(`Item #${index}: Missing or empty required field 'id' (string).`);
        }
        if (!item.text_for_vector || typeof item.text_for_vector !== 'string' || item.text_for_vector.trim() === '') {
            errors.push(`Item #${index} (id: ${item.id || 'N/A'}): Missing or empty required field 'text_for_vector' (string).`);
        }
    });

    return {
        isValid: errors.length === 0,
        errors,
        count: data.length
    };
}
