// Copyright (c) 2026 1abcdefggs
// SPDX-License-Identifier: MIT
// https://github.com/1abcdefggs/vect-or-generate

import fs from 'fs';
import path from 'path';
import { embedPassage } from '../core/embedder.mjs';
import { validateRawData } from '../core/validator.mjs';

/**
 * Standard Recipe: Generates a 384-dimensional knowledge base JSON from raw JSON items.
 * @param {Object} options
 * @param {string} options.inputPath - Path to input JSON
 * @param {string} options.outputPath - Path to output kb_*.json
 * @param {string} [options.modelName] - Embedding model ID
 * @param {boolean} [options.dryRun] - Validation only flag
 * @param {Function} [options.onProgress] - Optional progress callback (current, total, item)
 * @returns {Promise<{ count: number, outputPath: string, elapsedSec: number }>}
 */
export async function runDefaultJsonRecipe({
    inputPath,
    outputPath,
    modelName = 'Xenova/multilingual-e5-small',
    dryRun = false,
    onProgress = null
}) {
    if (!fs.existsSync(inputPath)) {
        throw new Error(`Input file not found: ${inputPath}`);
    }

    const rawContent = fs.readFileSync(inputPath, 'utf8');
    let data;
    try {
        data = JSON.parse(rawContent);
    } catch (e) {
        throw new Error(`Failed to parse input JSON in ${inputPath}: ${e.message}`);
    }

    const validation = validateRawData(data);
    if (!validation.isValid) {
        const sampleErrors = validation.errors.slice(0, 5).join('\n  - ');
        throw new Error(`Data validation failed (${validation.errors.length} errors):\n  - ${sampleErrors}`);
    }

    if (dryRun) {
        return { count: data.length, outputPath, elapsedSec: 0 };
    }

    const startTime = Date.now();
    const knowledgeBase = [];

    for (let i = 0; i < data.length; i++) {
        const item = data[i];
        const vector = await embedPassage(item.text_for_vector, modelName);
        const { text_for_vector, ...metadata } = item;

        knowledgeBase.push({
            ...metadata,
            vector
        });

        if (onProgress) {
            onProgress(i + 1, data.length, item);
        }
    }

    const outDir = path.dirname(outputPath);
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(knowledgeBase, null, 2), 'utf8');
    const elapsedSec = (Date.now() - startTime) / 1000;

    return {
        count: knowledgeBase.length,
        outputPath,
        elapsedSec
    };
}
