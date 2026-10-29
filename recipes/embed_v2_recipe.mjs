// Copyright (c) 2026 1abcdefggs
// SPDX-License-Identifier: MIT
// https://github.com/1abcdefggs/vect-or-generate

import fs from 'node:fs';
import path from 'node:path';
import { embedConceptsV2 } from '../core/compiler/embedV2.mjs';

/**
 * Recipe: attaches vector embeddings to a schema v2 (concepts[]) document and writes it back as v2.
 * Thin adapter around embedConceptsV2.
 *
 * @param {Object} options
 * @param {Object} options.doc - parsed v2 document
 * @param {string} options.outputPath - Path to output kb_*.json
 * @param {string} [options.modelName] - Embedding model ID
 * @param {Function} [options.onProgress] - Optional progress callback
 * @returns {Promise<{ embedded: number, skipped: number, facet: string, warnings: string[], outputPath: string, elapsedSec: number }>}
 */
export async function runEmbedV2Recipe(options) {
    const start = Date.now();
    const { doc, embedded, skipped, facet, warnings } = await embedConceptsV2(options.doc, {
        modelName: options.modelName,
        onProgress: options.onProgress
    });
    fs.mkdirSync(path.dirname(options.outputPath), { recursive: true });
    fs.writeFileSync(options.outputPath, JSON.stringify(doc, null, 2), 'utf8');
    return { embedded, skipped, facet, warnings, outputPath: options.outputPath, elapsedSec: (Date.now() - start) / 1000 };
}
