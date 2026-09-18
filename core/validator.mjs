// Copyright (c) 2026 1abcdefggs
// SPDX-License-Identifier: MIT
// https://github.com/1abcdefggs/vect-or-generate

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

        if (item.layer !== undefined && (typeof item.layer !== 'number' || item.layer < 0 || item.layer > 9)) {
            errors.push(`Item #${index} (id: ${item.id || 'N/A'}): 'layer' must be an integer between 0 and 9.`);
        }
    });

    return {
        isValid: errors.length === 0,
        errors,
        count: entities.length,
        domain
    };
}
