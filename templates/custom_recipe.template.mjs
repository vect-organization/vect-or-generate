// Copyright (c) 2026 1abcdefggs
// SPDX-License-Identifier: MIT
// https://github.com/1abcdefggs/vect-or-generate

import fs from 'fs';
import path from 'path';
import { embedPassage } from '../core/embedder.mjs';

/**
 * Custom Recipe Template: Parses custom CSV, TSV, or text and compiles into a VectOrEditOr Knowledge Base.
 * @param {string} inputPath - Path to custom source file
 * @param {string} outputPath - Destination path for generated kb_*.json
 */
export async function runCustomRecipe(inputPath, outputPath) {
    console.log(`[Custom Recipe] Reading source data from: ${inputPath}`);
    
    // 1. Ingest and parse raw source items
    const rawContent = fs.readFileSync(inputPath, 'utf8');
    
    // TODO: Add custom parser logic here (e.g. CSV splitter, regex extractor, JSON transformer)
    const parsedItems = [
        {
            id: 'CUSTOM-001',
            name: 'Sample Custom Item',
            reading: 'sample custom item',
            text_for_vector: 'Context passage containing target keywords and terminology to be embedded in 384-dimensional vector space.',
            template: 'Standard reusable clause or text snippet inserted into the editor.'
        }
    ];

    // 2. Process & compute 384-dimensional vector embeddings
    const results = [];
    for (const item of parsedItems) {
        const vector = await embedPassage(item.text_for_vector);
        results.push({
            id: item.id,
            name: item.name,
            reading: item.reading,
            vector,
            template: item.template
        });
    }

    // 3. Write compiled knowledge base to output destination
    const outDir = path.dirname(outputPath);
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf8');
    console.log(`[Custom Recipe] Knowledge base compilation complete. Saved to: ${outputPath}`);
}
