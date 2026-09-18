// Copyright (c) 2026 1abcdefggs
// SPDX-License-Identifier: MIT
// https://github.com/1abcdefggs/vect-or-generate

import fs from 'node:fs';
import path from 'node:path';
import { encryptKnowledgeBase } from '../core/vault/index.js';

/**
 * Import Encrypt Recipe: Reads an existing JSON knowledge base, encrypts it,
 * and writes it to an output file.
 * 
 * @param {Object} options
 * @param {string} options.inputPath - Path to input JSON
 * @param {string} options.outputPath - Path to output encrypted file (.venc)
 * @param {string} options.password - Password for encryption
 * @returns {Promise<{ outputPath: string, elapsedSec: number }>}
 */
export async function runImportEncryptRecipe(options) {
    if (!fs.existsSync(options.inputPath)) {
        throw new Error(`Input file not found: ${options.inputPath}`);
    }

    if (!options.password) {
        throw new Error('Password is required to encrypt the imported knowledge base.');
    }

    const startTime = Date.now();
    
    // Read and parse to ensure it's valid JSON
    const rawContent = fs.readFileSync(options.inputPath, 'utf8');
    let jsonData;
    try {
        jsonData = JSON.parse(rawContent);
    } catch (e) {
        throw new Error(`Failed to parse input JSON in ${options.inputPath}: ${e.message}`);
    }

    // Encrypt
    const encryptedBuffer = await encryptKnowledgeBase(jsonData, options.password);

    // Write to output path
    const outDir = path.dirname(options.outputPath);
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }
    fs.writeFileSync(options.outputPath, encryptedBuffer);

    const elapsedSec = (Date.now() - startTime) / 1000;

    return {
        outputPath: options.outputPath,
        elapsedSec
    };
}
