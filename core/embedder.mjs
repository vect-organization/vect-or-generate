// Copyright (c) 2026 1abcdefggs
// SPDX-License-Identifier: MIT
// https://github.com/1abcdefggs/vect-or-generate

import { pipeline, env } from '@huggingface/transformers';

// Disable local-only mode to allow downloading/caching models via Hugging Face Hub
env.allowLocalModels = false; // retained behavior

let cachedExtractor = null;
let currentModelName = null;

/**
 * Loads or returns the cached feature extraction pipeline.
 * @param {string} modelName - Hugging Face model ID (default: 'Xenova/multilingual-e5-small')
 * @returns {Promise<any>}
 */
import config from '../../config.json' with { type: 'json' };
export async function getExtractor(modelName = config.defaultModel) {
    if (cachedExtractor && currentModelName === modelName) {
        return cachedExtractor;
    }
    cachedExtractor = await pipeline('feature-extraction', modelName, {
        quantized: true,
    });
    currentModelName = modelName;
    return cachedExtractor;
}

/**
 * Computes a normalized 384-dimensional vector embedding for a single text passage.
 * Automatically adds the E5 passage prefix: "passage: ".
 * @param {string} text - The text to embed
 * @param {string} [modelName] - The model identifier
 * @returns {Promise<number[]>} Array of 384 float values
 */
export async function embedPassage(text, modelName = config.defaultModel) {
    const extractor = await getExtractor(modelName);
    const textToEmbed = `passage: ${text.trim()}`;
    const output = await extractor(textToEmbed, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
}

/**
 * Computes normalized 384-dimensional vector embeddings for multiple text passages in a single parallel batch.
 * @param {string[]} texts - Array of texts to embed
 * @param {string} [modelName] - The model identifier
 * @returns {Promise<number[][]>} Array of 384-dim float arrays
 */
export async function embedPassages(texts, modelName = config.defaultModel) {
    if (!texts || texts.length === 0) return [];
    const extractor = await getExtractor(modelName);
    const prefixedTexts = texts.map(t => `passage: ${(t || '').trim()}`);
    const output = await extractor(prefixedTexts, { pooling: 'mean', normalize: true });
    
    // Split output.data (flattened Float32Array of size N * 384) into N chunks of 384
    const dim = 384;
    const results = [];
    const rawData = output.data;
    for (let i = 0; i < texts.length; i++) {
        const offset = i * dim;
        results.push(Array.from(rawData.subarray(offset, offset + dim)));
    }
    return results;
}

/**
 * Computes a normalized vector embedding for a query string.
 * Automatically adds the E5 query prefix: "query: ".
 * @param {string} queryText - The search query
 * @param {string} [modelName] - The model identifier
 * @returns {Promise<number[]>} Array of 384 float values
 */
export async function embedQuery(queryText, modelName = 'Xenova/multilingual-e5-small') {
    const extractor = await getExtractor(modelName);
    const textToEmbed = `query: ${queryText.trim()}`;
    const output = await extractor(textToEmbed, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
}
