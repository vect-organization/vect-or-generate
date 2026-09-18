// Copyright (c) 2026 1abcdefggs
// SPDX-License-Identifier: MIT
// https://github.com/1abcdefggs/vect-or-generate

import fs from 'node:fs';
import { compile } from '../core/compiler/index.mjs';

/**
 * Custom Recipe Template: Ingests custom data (CSV/JSON/TSV) and compiles into a 10-Layer VectOr Knowledge Base.
 * 
 * @param {Object} options
 * @param {string} options.inputPath - Path to custom source file
 * @param {string} options.outputPath - Destination path for generated kb_*.json
 * @param {string} [options.domain='custom_domain'] - Domain identifier
 * @param {string} [options.modelName] - Embedding model identifier
 * @param {boolean} [options.dryRun=false] - Validation mode without vector computation
 */
export async function runCustomRecipe({
    inputPath,
    outputPath,
    domain = 'custom_domain',
    modelName = undefined,
    dryRun = false
}) {
    console.log(`[Custom Recipe] Reading source data from: ${inputPath}`);
    
    // 1. Ingest and parse raw custom source content (e.g. CSV, TSV, or custom JSON)
    const rawContent = fs.readFileSync(inputPath, 'utf8');
    
    // TODO: Implement custom parsing logic here.
    // Example extracted raw items:
    const rawItems = [
        {
            id: '#01',
            name: 'Sample Knowledge Entity',
            reading: 'sample entity',
            definition: 'Standard definition passage containing domain terminology to be embedded into vector space.',
            layer: 4,
            category: 'General',
            code: 'SPEC-01',
            synonyms: ['Sample Synonym', 'Alias'],
            inEditor: true,
            metadata: {
                source: {
                    type: 'official_doc',
                    title: 'Sample Source Reference',
                    url: 'https://example.com/doc',
                    retrieved_at: new Date().toISOString().split('T')[0],
                    raw_snippet: 'Original unmodified snippet text...'
                }
            }
        }
    ];

    // 2. Delegate validation, 10-layer normalization, batch embedding, and saving to Compiler Module
    const result = await compile({
        data: rawItems,
        output: outputPath,
        domain,
        modelName,
        dryRun
    });

    console.log(`[Custom Recipe] Knowledge Base v${result.version} compilation complete. Saved to: ${outputPath}`);
    
    return {
        count: result.entities.length,
        domain: result.domain,
        outputPath
    };
}
