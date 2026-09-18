// Copyright (c) 2026 1abcdefggs
// SPDX-License-Identifier: MIT
// https://github.com/1abcdefggs/vect-or-generate

import { compile } from '../core/compiler/index.mjs';

/**
 * Standard Recipe: Generates a 10-layer standard knowledge base JSON from raw JSON items.
 * Thin adapter delegating to the unified compiler module.
 * 
 * @param {Object} options
 * @param {string} options.inputPath - Path to input JSON
 * @param {string} options.outputPath - Path to output kb_*.json
 * @param {string} [options.domain] - Domain identifier override
 * @param {string} [options.modelName] - Embedding model ID
 * @param {boolean} [options.dryRun] - Validation only flag
 * @param {Function} [options.onProgress] - Optional progress callback
 * @returns {Promise<{ count: number, domain: string, outputPath: string, elapsedSec: number }>}
 */
export async function runDefaultJsonRecipe(options) {
    return await compile({
        input: options.inputPath,
        output: options.outputPath,
        domain: options.domain,
        modelName: options.modelName,
        dryRun: options.dryRun,
        onProgress: options.onProgress
    });
}
