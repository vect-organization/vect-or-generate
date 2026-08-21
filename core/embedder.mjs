// Copyright (c) 2026 1abcdefggs
// SPDX-License-Identifier: MIT
// https://github.com/1abcdefggs/vect-or-generate

import { pipeline, env } from '@huggingface/transformers';

// Disable local-only mode to allow downloading/caching models via Hugging Face Hub
env.allowLocalModels = false;

let cachedExtractor = null;
let currentModelName = null;

/**
 * Loads or returns the cached feature extraction pipeline.
 * @param {string} modelName - Hugging Face model ID (default: 'Xenova/multilingual-e5-small')
 * @returns {Promise<any>}
 */
export async function getExtractor(modelName = 'Xenova/multilingual-e5-small') {
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
 * Computes a normalized 384-dimensional vector embedding for a given text passage.
 * Automatically adds the E5 passage prefix: "passage: ".
 * @param {string} text - The text to embed
 * @param {string} modelName - The model identifier
 * @returns {Promise<number[]>} Array of 384 float values
 */
export async function embedPassage(text, modelName = 'Xenova/multilingual-e5-small') {
    const extractor = await getExtractor(modelName);
    const textToEmbed = `passage: ${text.trim()}`;
    const output = await extractor(textToEmbed, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
}

/**
 * Computes a normalized vector embedding for a query string.
 * Automatically adds the E5 query prefix: "query: ".
 * @param {string} queryText - The search query
 * @param {string} modelName - The model identifier
 * @returns {Promise<number[]>}
 */
export async function embedQuery(queryText, modelName = 'Xenova/multilingual-e5-small') {
    const extractor = await getExtractor(modelName);
    const textToEmbed = `query: ${queryText.trim()}`;
    const output = await extractor(textToEmbed, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
}
