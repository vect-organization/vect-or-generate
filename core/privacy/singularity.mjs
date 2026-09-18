// Copyright (c) 2026 1abcdefggs
// SPDX-License-Identifier: MIT
// Singularity Outlier Detection & Adaptive Sampling Module

/**
 * Computes dot product between two normalized vectors.
 */
function dotProduct(a, b) {
    if (!a || !b || a.length !== b.length) return 0.0;
    let sum = 0.0;
    for (let i = 0; i < a.length; i++) {
        sum += a[i] * b[i];
    }
    return sum;
}

/**
 * Selects an adaptive random sample of entities if size exceeds sampleLimit.
 * @param {Array} entities 
 * @param {number} sampleLimit 
 * @returns {{ sample: Array, isSampled: boolean }}
 */
export function getAdaptiveSample(entities, sampleLimit = 500) {
    if (!Array.isArray(entities) || entities.length <= sampleLimit) {
        return { sample: entities, isSampled: false };
    }

    const step = entities.length / sampleLimit;
    const sample = [];
    for (let i = 0; i < sampleLimit; i++) {
        const idx = Math.min(Math.floor(i * step), entities.length - 1);
        sample.push(entities[idx]);
    }

    return { sample, isSampled: true };
}

/**
 * Detects singularity vectors (isolated outliers in embedding space).
 * Highly isolated clinical entities pose acute re-identification risks.
 * 
 * @param {Array<Object>} entities - Entity collection with .vector properties
 * @param {Object} [options={}]
 * @param {number} [options.threshold=0.60] - Nearest neighbor similarity threshold below which an entity is marked as outlier
 * @param {number} [options.sampleLimit=500] - Upper bound on sampling for large collections
 * @returns {{ singularities: Array<{ item: Object, minSim: number, riskLevel: 'HIGH' | 'MED' }>, isSampled: boolean }}
 */
export function detectSingularities(entities, options = {}) {
    const { threshold = 0.60, sampleLimit = 500 } = options;

    if (!Array.isArray(entities) || entities.length < 2) {
        return { singularities: [], isSampled: false };
    }

    const { sample, isSampled } = getAdaptiveSample(entities, sampleLimit);
    const singularities = [];

    for (let i = 0; i < sample.length; i++) {
        const target = sample[i];
        if (!target.vector || target.vector.length === 0) continue;

        let maxSimilarity = -1.0; // Max similarity to any OTHER entity (i.e. nearest neighbor)

        for (let j = 0; j < sample.length; j++) {
            if (i === j) continue;
            const candidate = sample[j];
            if (!candidate.vector || candidate.vector.length === 0) continue;

            const sim = dotProduct(target.vector, candidate.vector);
            if (sim > maxSimilarity) {
                maxSimilarity = sim;
            }
        }

        // If even the closest neighbor is below threshold, this is an isolated singularity point
        if (maxSimilarity < threshold) {
            const riskLevel = maxSimilarity < (threshold * 0.75) ? 'HIGH' : 'MED';
            singularities.push({
                item: target,
                minSim: Math.round(maxSimilarity * 1000) / 1000,
                riskLevel
            });
        }
    }

    return {
        singularities,
        isSampled
    };
}
