// Copyright (c) 2026 1abcdefggs
// SPDX-License-Identifier: MIT
// Linter & Rule Profile Generator (guideline_[domain].json)

import config from '../../config.json' with { type: 'json' };
import { loadLegacyLayerSet } from '../registryLoader.mjs';

// Shape version of guideline_*.json (schemas/guideline.schema.json), independent of the build version.
const GUIDELINE_SCHEMA_VERSION = '0.4.0';

const version = config.version || '0.3.0';

/**
 * Generates a standard Linter & Rule profile JSON for VectOrEdit real-time linting.
 * 
 * @param {Array<Object>} entities 
 * @param {Object} [options={}]
 * @param {string} [options.domain='general']
 * @param {string} [options.taxonomyCode='Standard']
 * @param {Array<Object>} [options.extraRules=[]] - Rules to append as they are (id, pattern, message, severity, ...)
 * @returns {Object} Guideline profile object
 */
export function generateLinterGuideline(entities, options = {}) {
    const { domain = 'general', taxonomyCode = 'Standard', extraRules = [] } = options;

    const rules = [];
    const synonymMap = {};
    const categories = new Set();

    // A synonym that is itself a headword, or that belongs to several headwords, has no single preferred term
    const headwords = new Set(entities.map((item) => item.name));
    const synonymOwners = new Map();
    for (const item of entities) {
        for (const syn of item.synonyms || []) synonymOwners.set(syn, (synonymOwners.get(syn) || 0) + 1);
    }

    for (const item of entities) {
        if (item.category) categories.add(item.category);

        // 1. Synonym Warning Rules (Terminology Standardization)
        if (Array.isArray(item.synonyms) && item.synonyms.length > 0) {
            for (const syn of item.synonyms) {
                if (!syn || syn === item.name || headwords.has(syn) || synonymOwners.get(syn) > 1) continue;
                synonymMap[syn] = item.name;
                rules.push({
                    id: `SYN-${item.id.replace('#', '')}-${syn.replace(/\s+/g, '_')}`,
                    type: 'synonym_standardization',
                    severity: 'warning',
                    facet: 'G.policy',
                    pattern: syn,
                    preferredTerm: item.name,
                    suggest: item.name, // the field the engine reads (vect-or-engine profile.rs GuidelineRule)
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
                facet: 'G.rule',
                targetEntity: item.name,
                code: item.code || 'L7-RULE',
                message: item.definition || item.description || 'Clinical safety rule requirement.',
                layer: 7
            });
        }
    }

    // Rules from outside the entity list (e.g. a source's term rules), already in the guideline rule shape
    for (const rule of extraRules) {
        rules.push(rule);
        if (rule.category) categories.add(rule.category);
    }

    return {
        domain,
        schemaVersion: GUIDELINE_SCHEMA_VERSION,
        version, // DEPRECATED alias: build number of the generator, not the file shape
        taxonomyCode,
        generatedAt: new Date().toISOString(),
        totalRules: rules.length,
        categories: Array.from(categories),
        synonymMap,
        requiredLayers: [...loadLegacyLayerSet()].sort((a, b) => a - b), // derived from registry, not a hardcoded 0-9 range
        rules
    };
}
