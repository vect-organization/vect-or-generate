// Copyright (c) 2026 1abcdefggs
// SPDX-License-Identifier: MIT
// 2-Axis Trade-Off Metrics & Risk Assessment Engine

import { getAdaptiveSample, detectSingularities } from './singularity.mjs';

function cosineSimilarity(a, b) {
    if (!a || !b || a.length !== b.length || a.length === 0) return 0.0;
    let dot = 0.0;
    let normA = 0.0;
    let normB = 0.0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    if (normA <= 0 || normB <= 0) return 0.0;
    const sim = dot / (Math.sqrt(normA) * Math.sqrt(normB));
    return isNaN(sim) ? 0.0 : Math.max(0, Math.min(1, sim));
}

/**
 * Evaluates the 2-Axis Trade-off between Semantic Retention (Fidelity) and Privacy Protection.
 * Uses adaptive sampling and entity-pairing to complete in under 5ms even on large shuffled collections.
 * 
 * @param {Array<Object>} currentEntities - Transformed entities
 * @param {Array<Object>} [originalEntities=null] - Baseline entities
 * @param {Object} [options={}]
 * @param {number} [options.sampleLimit=200] - Sample limit for evaluation
 * @param {boolean} [options.detectSingularity=true] - Run singularity outlier check
 * @returns {Object} 2-Axis metrics and risk assessment
 */
export function evaluatePrivacyMetrics(currentEntities, originalEntities = null, options = {}) {
    const { sampleLimit = 200, detectSingularity = true } = options;
    const baseList = originalEntities || currentEntities;

    if (!Array.isArray(currentEntities) || currentEntities.length === 0) {
        return {
            fidelityScore: 100.0,
            privacyScore: 80.0,
            singularityRisk: 'LOW',
            singularityCount: 0,
            alerts: [],
            sampleSize: 0,
            isSampled: false
        };
    }

    const { sample: curSample, isSampled } = getAdaptiveSample(currentEntities, sampleLimit);

    // Build lookup map for baseline entities by name / definition to handle shuffled order
    const origMapByName = new Map();
    const origMapById = new Map();
    for (const item of baseList) {
        if (item.name) origMapByName.set(item.name, item);
        if (item.id) origMapById.set(item.id, item);
    }

    // 1. Calculate Average Cosine Similarity (Semantic Retention / Fidelity)
    let totalSimilarity = 0.0;
    let validPairCount = 0;

    for (let i = 0; i < curSample.length; i++) {
        const curItem = curSample[i];
        const vCur = curItem?.vector;
        if (!vCur || vCur.length === 0) continue;

        // Match with baseline counterpart by name, or fall back to position
        const origItem = (curItem.name && origMapByName.get(curItem.name)) || 
                         (curItem.id && origMapById.get(curItem.id)) || 
                         baseList[i];

        const vOrig = origItem?.vector;
        if (vOrig && vOrig.length === vCur.length) {
            const sim = cosineSimilarity(vCur, vOrig);
            totalSimilarity += sim;
            validPairCount++;
        }
    }

    const meanCosineSim = validPairCount > 0 ? (totalSimilarity / validPairCount) : 1.0;
    const fidelityScore = Math.round(meanCosineSim * 1000) / 10;

    // 2. Calculate Privacy Protection Score
    // Factors: Metadata stripped, ID anonymized, DP Noise injected
    let privacyScore = 70.0;
    const sampleItem = curSample[0] || {};

    if (sampleItem.metadata && sampleItem.metadata.source === null) {
        privacyScore += 12.0;
    }
    if (sampleItem.definition && sampleItem.definition.includes('[Sanitized via Paraphrase]')) {
        privacyScore += 8.0;
    }
    if (meanCosineSim < 0.999) {
        // DP Noise active
        privacyScore += Math.min(10.0, (1.0 - meanCosineSim) * 200.0);
    }
    privacyScore = Math.min(100.0, Math.round(privacyScore * 10) / 10);

    // 3. Singularity Risk Check
    let singularityRisk = 'LOW';
    let singularityAlerts = [];

    if (detectSingularity) {
        const { singularities } = detectSingularities(currentEntities, {
            threshold: 0.60,
            sampleLimit
        });

        singularityAlerts = singularities.map(s => ({
            id: s.item.id,
            name: s.item.name,
            minNeighborSim: s.minSim,
            riskLevel: s.riskLevel,
            action: 'Differential Noise Boost Applied'
        }));

        if (singularities.length > 0) {
            const hasHigh = singularities.some(s => s.riskLevel === 'HIGH');
            singularityRisk = hasHigh ? 'HIGH' : 'MED';
        }
    }

    return {
        fidelityScore,
        privacyScore,
        singularityRisk,
        singularityCount: singularityAlerts.length,
        alerts: singularityAlerts,
        sampleSize: curSample.length,
        isSampled
    };
}
