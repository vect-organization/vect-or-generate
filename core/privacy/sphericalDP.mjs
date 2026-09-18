// Copyright (c) 2026 1abcdefggs
// SPDX-License-Identifier: MIT
// Spherical Tangent Projection Differential Privacy (DP) Engine

/**
 * Generates standard Gaussian distributed random variable using Box-Muller transform.
 */
function sampleGaussian() {
    let u1 = Math.random();
    let u2 = Math.random();
    while (u1 === 0) u1 = Math.random();
    while (u2 === 0) u2 = Math.random();
    return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
}

/**
 * Generates standard Laplace distributed random variable with scale b.
 * PDF: f(x) = (1 / 2b) * exp(-|x| / b)
 */
function sampleLaplace(b = 1.0) {
    const u = Math.random() - 0.5;
    return -b * Math.sign(u) * Math.log(1.0 - 2.0 * Math.abs(u));
}

/**
 * Injects calibrated Differential Privacy noise into an L2-normalized vector.
 * Uses Spherical Tangent Projection to perturb the vector along its orthogonal tangent plane
 * before projecting back to the unit hypersphere, maintaining maximal semantic fidelity.
 * 
 * @param {number[] | Float32Array} vector - Original embedding vector
 * @param {Object} [options={}]
 * @param {number} [options.epsilon=0.04] - DP noise magnitude
 * @param {string} [options.mechanism='spherical_gaussian'] - 'spherical_gaussian' | 'laplace' | 'uniform'
 * @returns {number[]} Perturbed, L2-normalized vector
 */
export function injectSphericalNoise(vector, options = {}) {
    if (!vector || vector.length === 0) return [];
    const len = vector.length;
    const { epsilon = 0.04, mechanism = 'spherical_gaussian' } = options;

    if (epsilon <= 0) return Array.from(vector);

    // 1. Compute original norm
    let originalNorm = 0.0;
    for (let i = 0; i < len; i++) {
        originalNorm += vector[i] * vector[i];
    }
    originalNorm = Math.sqrt(originalNorm) || 1.0;

    // 2. Generate raw noise vector
    const rawNoise = new Array(len);
    for (let i = 0; i < len; i++) {
        if (mechanism === 'laplace') {
            rawNoise[i] = sampleLaplace(1.0);
        } else if (mechanism === 'uniform') {
            rawNoise[i] = (Math.random() - 0.5) * 2.0;
        } else {
            // spherical_gaussian default
            rawNoise[i] = sampleGaussian();
        }
    }

    // 3. Project noise onto the tangent space of vector: n_perp = n - (n . v_unit) * v_unit
    let dotNoiseV = 0.0;
    for (let i = 0; i < len; i++) {
        dotNoiseV += rawNoise[i] * (vector[i] / originalNorm);
    }

    const tangentNoise = new Array(len);
    let tangentNorm = 0.0;
    for (let i = 0; i < len; i++) {
        const vUnit = vector[i] / originalNorm;
        const perp = rawNoise[i] - dotNoiseV * vUnit;
        tangentNoise[i] = perp;
        tangentNorm += perp * perp;
    }
    tangentNorm = Math.sqrt(tangentNorm) || 1.0;

    // Normalize tangent noise vector to unit length
    for (let i = 0; i < len; i++) {
        tangentNoise[i] /= tangentNorm;
    }

    // 4. Combine unit vector with tangent perturbation and project back to unit sphere:
    // v_noisy = (v_unit + epsilon * tangentNoise) / ||v_unit + epsilon * tangentNoise||
    const noisy = new Array(len);
    let finalNorm = 0.0;
    for (let i = 0; i < len; i++) {
        const val = (vector[i] / originalNorm) + epsilon * tangentNoise[i];
        noisy[i] = val;
        finalNorm += val * val;
    }

    finalNorm = Math.sqrt(finalNorm) || 1.0;
    for (let i = 0; i < len; i++) {
        noisy[i] /= finalNorm;
    }

    return noisy;
}
