// Copyright (c) 2026 1abcdefggs
// SPDX-License-Identifier: MIT
// Knowledge Base Compiler - Unified Deep Module Interface

import { compileData } from './pipeline.mjs';
import { compileFile } from './fileAdapter.mjs';
import { normalizeEntity, SEMANTIC_LAYERS } from './layerRegistry.mjs';

/**
 * Universal polymorphic compiler entrypoint.
 * Automatically branches between File-to-File pipeline and In-Memory Pure Data compilation.
 * 
 * @param {Object} options
 * @param {string} [options.input] - Input file path (if using file pipeline)
 * @param {string} [options.output] - Output destination path (if saving to disk)
 * @param {Array|Object} [options.data] - In-memory raw entities/object (if compiling in memory)
 * @param {string} [options.domain] - Domain identifier override
 * @param {string} [options.prefix='#'] - Entity prefix symbol
 * @param {string} [options.modelName] - Embedding model identifier
 * @param {boolean} [options.dryRun=false] - When true, runs validation without vector computation
 * @param {Function} [options.embedder] - Injected embedding adapter function
 * @param {Function} [options.onProgress] - Optional progress callback
 * @returns {Promise<Object>} Compilation result summary or payload
 */
export async function compile(options = {}) {
    // Branch 1: File-based compilation
    if (options.input || options.inputPath) {
        const inPath = options.input || options.inputPath;
        const outPath = options.output || options.outputPath || null;
        return await compileFile(inPath, outPath, options);
    }

    // Branch 2: In-memory compilation
    const rawData = options.data || options.rawEntities || options.entities;
    if (rawData) {
        const payload = await compileData(rawData, options);
        if (options.output || options.outputPath) {
            const outPath = options.output || options.outputPath;
            const fs = await import('node:fs');
            const path = await import('node:path');
            const outDir = path.dirname(outPath);
            if (!fs.existsSync(outDir)) {
                fs.mkdirSync(outDir, { recursive: true });
            }
            fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf8');
        }
        return payload;
    }

    throw new Error('Invalid compile() arguments: specify either "input" file path or in-memory "data"');
}

export {
    compileData,
    compileFile,
    normalizeEntity,
    SEMANTIC_LAYERS
};
