// Copyright (c) 2026 1abcdefggs
// SPDX-License-Identifier: MIT
// Linter & Rule Profile Generator (guideline_[domain].json)

import config from '../../config.json' with { type: 'json' };

const version = config.version || '0.3.0';

/**
 * Generates a standard Linter & Rule profile JSON for VectOrEdit real-time linting.
 * 
 * @param {Array<Object>} entities 
 * @param {Object} [options={}]
 * @param {string} [options.domain='general']
 * @param {string} [options.taxonomyCode='Standard']
 * @returns {Object} Guideline profile object
 */
export function generateLinterGuideline(entities, options = {}) {
    const { domain = 'general', taxonomyCode = 'Standard' } = options;

    const rules = [];
    const synonymMap = {};
    const categories = new Set();

    for (const item of entities) {
        if (item.category) categories.add(item.category);

        // 1. Synonym Warning Rules (Terminology Standardization)
        if (Array.isArray(item.synonyms) && item.synonyms.length > 0) {
            for (const syn of item.synonyms) {
                synonymMap[syn] = item.name;
                rules.push({
                    id: `SYN-${item.id.replace('#', '')}-${syn.replace(/\s+/g, '_')}`,
                    type: 'synonym_standardization',
                    severity: 'warning',
                    pattern: syn,
                    preferredTerm: item.name,
                    message: `Consider using standard term '${item.name}' instead of synonym '${syn}'.`,
                    layer: item.layer ?? 4
                });
            }
        }

        // 2. Layer 7 Explicit Rule Extraction
        if (item.layer === 7) {
            rules.push({
                id: `RULE-${item.id.replace('#', '')}`,
                type: 'clinical_guideline',
                severity: 'error',
                targetEntity: item.name,
                code: item.code || 'L7-RULE',
                message: item.definition || item.description || 'Clinical safety rule requirement.',
                layer: 7
            });
        }
    }

    return {
        domain,
        version,
        taxonomyCode,
        generatedAt: new Date().toISOString(),
        totalRules: rules.length,
        categories: Array.from(categories),
        synonymMap,
        requiredLayers: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        rules
    };
}
