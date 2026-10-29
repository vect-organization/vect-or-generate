// Copyright (c) 2026 1abcdefggs
// SPDX-License-Identifier: MIT
// Core Pure In-Memory Compilation Pipeline

import config from '../../config.json' with { type: 'json' };
import { validateRawData } from '../validator.mjs';
import { normalizeEntity } from './layerRegistry.mjs';
import { findEmbeddingFacetByModelId, loadFacetRegistry } from '../registryLoader.mjs';

// schemaVersion = entities[] shape marker (fixed); config.version = build number (moves every commit).
// Previously conflated under `version`, which made tests/compiler.test.mjs drift on every version bump.
const LEGACY_ENTITIES_SCHEMA_VERSION = '0.3.0';

/**
 * Embedding-space fields of the KB header. `spaceId` is the embedding facet id (registry/facets.json), so two
 * builds of the same model (Xenova/... and intfloat/...) share one space. A model with no facet gets no
 * `spaceId`: the editor then treats the dictionary as "model unknown" and compares dimensions only.
 */
function embeddingHeader(modelName) {
    const spaceId = findEmbeddingFacetByModelId(modelName);
    const facet = spaceId ? loadFacetRegistry()[spaceId] : null;
    return {
        model: modelName,
        ...(spaceId ? { spaceId } : {}),
        ...(facet?.queryPrefix !== undefined ? { prefixes: { query: facet.queryPrefix, passage: facet.passagePrefix ?? '' } } : {})
    };
}

/**
 * Compiles in-memory raw entities into a fully validated, 10-layer normalized Knowledge Base payload.
 * 
 * @param {Array|Object} rawInput - Raw entity array or wrapped { entities, domain, prefix } object
 * @param {Object} [options={}]
 * @param {string} [options.domain='general'] - Domain name override
 * @param {string} [options.prefix='#'] - Entity prefix symbol
 * @param {string} [options.modelName=config.defaultModel] - Embedding model ID
 * @param {boolean} [options.dryRun=false] - When true, skips vector computation
 * @param {Function} [options.embedder=embedPassages] - Injected vector embedding function for testing / custom engines
 * @param {Function} [options.onProgress=null] - Progress callback (current, total, item)
 * @returns {Promise<Object>} 10-layer standard knowledge base object
 */
export async function compileData(rawInput, options = {}) {
    const {
        domain = null,
        prefix = '#',
        modelName = config.defaultModel,
        dryRun = false,
        embedder = null,
        onProgress = null
    } = options;

    let rawEntities = [];
    let detectedDomain = domain || 'general';
    let detectedPrefix = prefix;

    if (Array.isArray(rawInput)) {
        rawEntities = rawInput;
    } else if (rawInput && typeof rawInput === 'object') {
        rawEntities = Array.isArray(rawInput.entities) ? rawInput.entities : [];
        if (!domain && rawInput.domain) {
            detectedDomain = rawInput.domain;
        }
        if (rawInput.prefix) {
            detectedPrefix = rawInput.prefix;
        }
    } else {
        throw new Error('Invalid compilation input: expected an array of entities or an object containing an entities array');
    }

    // 1. Schema Validation
    const validation = validateRawData(rawEntities);
    if (!validation.isValid) {
        const errorSummary = validation.errors.slice(0, 5).join('\n  - ');
        throw new Error(`Data validation failed (${validation.errors.length} errors):\n  - ${errorSummary}`);
    }

    if (dryRun) {
        const normalizedEntities = rawEntities.map((item, idx) => ({
            ...normalizeEntity(item, idx),
            vector: []
        }));

        return {
            domain: detectedDomain,
            schemaVersion: LEGACY_ENTITIES_SCHEMA_VERSION,
            version: config.version, // DEPRECATED alias (build number), not a schema-shape marker
            prefix: detectedPrefix,
            dimension: config.dimension,
            metric: 'cosine',
            ...embeddingHeader(modelName),
            is_sanitized: false,
            fidelity_score: 100.0,
            entities: normalizedEntities
        };
    }

    // 2. Synthesize embedding passages
    const textsToEmbed = rawEntities.map((item) => {
        return (item.text_for_vector || `${item.name || ''} ${item.definition || item.description || ''}`).trim();
    });

    // 3. Batch compute vector embeddings
    let vectors = [];
    if (typeof embedder === 'function') {
        vectors = await embedder(textsToEmbed, modelName);
    } else {
        const { embedPassages } = await import('../embedder.mjs');
        vectors = await embedPassages(textsToEmbed, modelName);
    }

    // 4. Assemble compiled 10-layer entity list
    const compiledEntities = rawEntities.map((item, idx) => {
        const normalized = normalizeEntity(item, idx);
        const vector = vectors[idx] || [];
        const entity = {
            ...normalized,
            vector
        };

        if (onProgress) {
            onProgress(idx + 1, rawEntities.length, entity);
        }

        return entity;
    });

    // 5. Construct top-level 10-layer standard payload
    const dimension = compiledEntities[0]?.vector?.length || config.dimension;

    return {
        domain: detectedDomain,
        schemaVersion: LEGACY_ENTITIES_SCHEMA_VERSION,
        version: config.version, // DEPRECATED alias (build number), not a schema-shape marker
        prefix: detectedPrefix,
        dimension,
        metric: 'cosine',
        ...embeddingHeader(modelName),
        is_sanitized: false,
        fidelity_score: 100.0,
        entities: compiledEntities
    };
}
