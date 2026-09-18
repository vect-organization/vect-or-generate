// Copyright (c) 2026 1abcdefggs
// SPDX-License-Identifier: MIT
// Unified 3-Artifact (+ Safetensors & Audit Manifest) Packaging Pipeline

import { compileData } from '../compiler/pipeline.mjs';
import { serializeToSafetensors, parseSafetensorsHeader } from './safetensors.mjs';
import { generateImeDictionary } from './imeGenerator.mjs';
import { generateLinterGuideline } from './guidelineGenerator.mjs';
import { generateAuditManifest } from './auditGenerator.mjs';
import { exportArtifactsToDisk, downloadArtifactFiles } from './bundleWriter.mjs';

/**
 * Packages the complete 5-artifact bundle (KB JSON, Safetensors Binary, Linter JSON, IME TSV, Audit Manifest)
 * in memory. Compatible with both Web (Blobs) and Node/CLI.
 * 
 * @param {Object} options
 * @param {Array<Object>} options.entities - 10-layer standard entity items
 * @param {string} [options.domain='general'] - Domain name
 * @param {string} [options.taxonomyCode='Standard'] - Taxonomy standard code
 * @param {string} [options.prefix='#'] - Entity ID prefix
 * @param {Object} [options.privacyAudit] - Privacy certification details
 * @param {boolean} [options.dryRun=false] - Dry run flag
 * @returns {Promise<{ domain: string, version: string, itemCount: number, files: Object, checksums: Object }>}
 */
export async function packageArtifactBundle(options = {}) {
    const {
        entities,
        domain = 'general',
        taxonomyCode = 'Standard',
        prefix = '#',
        privacyAudit = null,
        dryRun = false
    } = options;

    if (!Array.isArray(entities) || entities.length === 0) {
        throw new Error('packageArtifactBundle: expected non-empty entities array');
    }

    // 1. Compile 10-Layer Knowledge Base payload
    const kbPayload = await compileData(entities, {
        domain,
        prefix,
        dryRun,
        // Since entities already have vectors, pass an identity embedder
        embedder: async () => entities.map(e => e.vector || [])
    });

    const files = {};

    // 2. Generate kb_[domain].json
    const kbFileName = `kb_${domain}.json`;
    files[kbFileName] = kbPayload;

    // 3. Generate kb_[domain].safetensors (Binary)
    const stFileName = `kb_${domain}.safetensors`;
    if (!dryRun && kbPayload.entities[0]?.vector?.length > 0) {
        files[stFileName] = serializeToSafetensors(kbPayload.entities, {
            domain,
            taxonomyCode,
            version: kbPayload.version
        });
    }

    // 4. Generate guideline_[domain].json (Linter profile)
    const guidelineFileName = `guideline_${domain}.json`;
    files[guidelineFileName] = generateLinterGuideline(kbPayload.entities, {
        domain,
        taxonomyCode
    });

    // 5. Generate ime_[domain].txt (TSV Dictionary)
    const imeFileName = `ime_${domain}.txt`;
    files[imeFileName] = generateImeDictionary(kbPayload.entities);

    // 6. Generate audit_manifest.json (SHA-256 Hashes)
    const auditManifest = await generateAuditManifest(files, {
        domain,
        privacyAudit
    });
    files['audit_manifest.json'] = auditManifest;

    return {
        domain,
        version: kbPayload.version,
        itemCount: kbPayload.entities.length,
        dimension: kbPayload.dimension,
        files,
        checksums: auditManifest.checksums
    };
}

export {
    serializeToSafetensors,
    parseSafetensorsHeader,
    generateImeDictionary,
    generateLinterGuideline,
    generateAuditManifest,
    exportArtifactsToDisk,
    downloadArtifactFiles
};
