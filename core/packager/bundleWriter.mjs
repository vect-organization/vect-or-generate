// Copyright (c) 2026 1abcdefggs
// SPDX-License-Identifier: MIT
// Bundle Writer & Downloader (Disk Export & Browser Blob Download)

import fs from 'node:fs';
import path from 'node:path';

/**
 * Writes all generated files in the bundle to the target disk directory.
 * 
 * @param {Object} bundle - Bundle object returned by packageArtifactBundle()
 * @param {string} outputDir - Destination directory path
 * @returns {Promise<string[]>} Array of written absolute file paths
 */
export async function exportArtifactsToDisk(bundle, outputDir) {
    if (!bundle || !bundle.files) {
        throw new Error('exportArtifactsToDisk: invalid bundle object');
    }

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const writtenPaths = [];

    for (const [filename, content] of Object.entries(bundle.files)) {
        const targetPath = path.resolve(outputDir, filename);

        if (content instanceof Uint8Array) {
            fs.writeFileSync(targetPath, content);
        } else if (typeof content === 'string') {
            fs.writeFileSync(targetPath, content, 'utf8');
        } else {
            fs.writeFileSync(targetPath, JSON.stringify(content, null, 2), 'utf8');
        }

        writtenPaths.push(targetPath);
    }

    return writtenPaths;
}

/**
 * Browser-only helper: downloads artifact files via sequential standard Blobs.
 * @param {Object} bundle 
 * @param {Object} [formatsFilter=null] - Optional map of format keys (json, safetensors, guideline, ime, audit)
 */
export function downloadArtifactFiles(bundle, formatsFilter = null) {
    if (typeof document === 'undefined' || !bundle || !bundle.files) {
        return;
    }

    const mimeTypes = {
        json: 'application/json',
        safetensors: 'application/octet-stream',
        venc: 'application/octet-stream',
        txt: 'text/plain;charset=utf-8'
    };

    let delay = 0;
    for (const [filename, content] of Object.entries(bundle.files)) {
        // Apply filter if specified
        if (formatsFilter) {
            if (filename.endsWith('.safetensors') && !formatsFilter.safetensors) continue;
            if (filename.startsWith('guideline_') && !formatsFilter.guideline) continue;
            if (filename.startsWith('ime_') && !formatsFilter.ime) continue;
            if (filename === 'audit_manifest.json' && !formatsFilter.audit) continue;
            if (filename.startsWith('kb_') && filename.endsWith('.json') && !formatsFilter.json) continue;
            if (filename.startsWith('kb_') && filename.endsWith('.venc') && !formatsFilter.venc && !formatsFilter.json) continue;
        }

        setTimeout(() => {
            let blob;
            const ext = filename.split('.').pop();
            const mime = mimeTypes[ext] || 'application/octet-stream';

            if (content instanceof Uint8Array) {
                blob = new Blob([content], { type: mime });
            } else if (typeof content === 'string') {
                blob = new Blob([content], { type: mime });
            } else {
                blob = new Blob([JSON.stringify(content, null, 2)], { type: mime });
            }

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, delay);

        delay += 180; // slight delay to prevent browser popup block
    }
}
