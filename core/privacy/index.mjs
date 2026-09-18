// Copyright (c) 2026 1abcdefggs
// SPDX-License-Identifier: MIT
// Core Privacy Engine - Unified Facade Interface

import { PRIVACY_PRESETS } from './presets.mjs';
import { injectSphericalNoise } from './sphericalDP.mjs';
import { detectSingularities, getAdaptiveSample } from './singularity.mjs';
import { stripProvenance, shuffleIdentifiers, anonymizeSyntax } from './transforms.mjs';
import { evaluatePrivacyMetrics } from './metrics.mjs';

/**
 * Universal Privacy & De-identification Pipeline.
 * Applies compliance presets, Spherical Tangent DP Noise, and Adaptive Singularity Protection.
 * 
 * @param {Array<Object>} entities - Target entity list
 * @param {Object} [options={}]
 * @param {string} [options.preset] - Compliance preset: 'hipaa_strict' | 'balanced_oss' | 'research_light'
 * @param {boolean} [options.stripProvenance] - Override strip source metadata
 * @param {boolean} [options.anonymizeSyntax] - Override paraphrase tag
 * @param {boolean} [options.shuffleIdentifiers] - Override entity ID shuffling
 * @param {boolean} [options.injectNoise] - Override DP noise injection
 * @param {string} [options.mechanism] - 'spherical_gaussian' | 'laplace' | 'uniform'
 * @param {number} [options.epsilon] - Noise magnitude
 * @param {boolean} [options.boostSingularity=true] - Apply extra noise to isolated outliers
 * @param {boolean} [options.computeMetrics=false] - Compute 2-Axis scores & singularity audit
 * @param {Array<Object>} [options.originalEntities] - Original baseline for fidelity metrics
 * @returns {Promise<{ entities: Array<Object>, metrics?: Object, audit: Object }>}
 */
export async function applyPrivacyTransforms(entities, options = {}) {
    if (!Array.isArray(entities)) {
        throw new Error('applyPrivacyTransforms: expected an array of entities');
    }

    const presetConfig = options.preset && PRIVACY_PRESETS[options.preset] ? PRIVACY_PRESETS[options.preset] : {};

    const stripProv = options.stripProvenance ?? presetConfig.stripProvenance ?? true;
    const anonSyntax = options.anonymizeSyntax ?? presetConfig.anonymizeSyntax ?? false;
    const shuffleIds = options.shuffleIdentifiers ?? presetConfig.shuffleIdentifiers ?? false;
    const injectNoise = options.injectNoise ?? presetConfig.injectNoise ?? true;
    const mechanism = options.mechanism || presetConfig.mechanism || 'spherical_gaussian';
    const epsilon = options.epsilon ?? presetConfig.epsilon ?? 0.04;
    const boostSingularity = options.boostSingularity ?? presetConfig.boostSingularity ?? true;
    const boostMultiplier = presetConfig.singularityBoostMultiplier || 1.5;
    const computeMetrics = options.computeMetrics ?? false;

    const appliedTransforms = [];

    // 1. Strip Provenance Metadata
    let processed = entities;
    if (stripProv) {
        processed = stripProvenance(processed);
        appliedTransforms.push('strip_provenance');
    }

    // 2. Syntactic Anonymization
    if (anonSyntax) {
        processed = anonymizeSyntax(processed);
        appliedTransforms.push('anonymize_syntax');
    }

    // 3. Shuffle Identifiers
    if (shuffleIds) {
        processed = shuffleIdentifiers(processed);
        appliedTransforms.push('shuffle_identifiers');
    }

    // 4. Singularity Detection (for outlier noise boost)
    let outlierIdSet = new Set();
    if (boostSingularity && injectNoise) {
        const { singularities } = detectSingularities(entities, { threshold: 0.55 });
        for (const s of singularities) {
            if (s.item && s.item.id) {
                outlierIdSet.add(s.item.id);
            }
        }
    }

    // 5. Differential Privacy Noise Injection
    if (injectNoise && epsilon > 0) {
        processed = processed.map(item => {
            if (!item.vector || item.vector.length === 0) return item;
            
            const isOutlier = outlierIdSet.has(item.id);
            const itemEpsilon = isOutlier ? (epsilon * boostMultiplier) : epsilon;

            const noisyVector = injectSphericalNoise(item.vector, {
                epsilon: itemEpsilon,
                mechanism
            });

            return {
                ...item,
                vector: noisyVector
            };
        });
        appliedTransforms.push(`spherical_dp_${mechanism}_eps${epsilon}`);
        if (outlierIdSet.size > 0) {
            appliedTransforms.push(`singularity_boost_count${outlierIdSet.size}`);
        }
    }

    // 6. Compute 2-Axis Trade-off Metrics (if requested)
    let metrics = undefined;
    if (computeMetrics) {
        metrics = evaluatePrivacyMetrics(processed, options.originalEntities || entities, {
            detectSingularity: true
        });
    }

    return {
        entities: processed,
        ...(metrics ? { metrics } : {}),
        audit: {
            preset: options.preset || null,
            appliedTransforms,
            itemCount: processed.length,
            timestamp: new Date().toISOString()
        }
    };
}

export {
    PRIVACY_PRESETS,
    injectSphericalNoise,
    detectSingularities,
    getAdaptiveSample,
    stripProvenance,
    shuffleIdentifiers,
    anonymizeSyntax,
    evaluatePrivacyMetrics
};
