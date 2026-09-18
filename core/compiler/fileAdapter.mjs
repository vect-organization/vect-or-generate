// Copyright (c) 2026 1abcdefggs
// SPDX-License-Identifier: MIT
// File I/O Adapter for Knowledge Base Compiler

import fs from 'node:fs';
import path from 'node:path';
import { compileData } from './pipeline.mjs';

/**
 * Reads an input JSON file, compiles into 10-layer standard knowledge base, and writes to destination.
 * 
 * @param {string} inputPath - Source JSON file path
 * @param {string} outputPath - Target kb_*.json destination path
 * @param {Object} [options={}] - Additional compilation options
 * @returns {Promise<{ count: number, domain: string, outputPath: string, elapsedSec: number, payload: Object }>}
 */
export async function compileFile(inputPath, outputPath, options = {}) {
    if (!fs.existsSync(inputPath)) {
        throw new Error(`Input file not found: ${inputPath}`);
    }

    const rawContent = fs.readFileSync(inputPath, 'utf8');
    let parsedJson;
    try {
        parsedJson = JSON.parse(rawContent);
    } catch (e) {
        throw new Error(`Failed to parse input JSON in ${inputPath}: ${e.message}`);
    }

    // Infer domain name from output or input filename if not specified
    let domainOverride = options.domain;
    if (!domainOverride) {
        if (parsedJson && typeof parsedJson === 'object' && parsedJson.domain) {
            domainOverride = parsedJson.domain;
        } else {
            const baseName = path.basename(inputPath, path.extname(inputPath)).replace(/^kb_/, '');
            domainOverride = baseName || 'general';
        }
    }

    const startTime = Date.now();
    const payload = await compileData(parsedJson, {
        ...options,
        domain: domainOverride
    });

    const elapsedSec = (Date.now() - startTime) / 1000;

    if (outputPath) {
        const outDir = path.dirname(outputPath);
        if (!fs.existsSync(outDir)) {
            fs.mkdirSync(outDir, { recursive: true });
        }
        fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2), 'utf8');
    }

    return {
        count: payload.entities.length,
        domain: payload.domain,
        outputPath: outputPath || null,
        elapsedSec,
        payload
    };
}
