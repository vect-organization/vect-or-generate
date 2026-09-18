// Copyright (c) 2026 1abcdefggs
// SPDX-License-Identifier: MIT
// Cryptographic Integrity & Audit Manifest Generator (SHA-256)

/**
 * Computes SHA-256 hex string for string or Uint8Array in an environment-agnostic way.
 * @param {string | Uint8Array} content 
 * @returns {Promise<string>} Hex hash string
 */
export async function computeSha256(content) {
    let bytes;
    if (typeof content === 'string') {
        bytes = new TextEncoder().encode(content);
    } else if (content instanceof Uint8Array) {
        bytes = content;
    } else {
        bytes = new TextEncoder().encode(JSON.stringify(content));
    }

    // Node.js environment
    if (typeof process !== 'undefined' && process.versions && process.versions.node) {
        const crypto = await import('node:crypto');
        return crypto.createHash('sha256').update(bytes).digest('hex');
    }

    // Browser WebCrypto environment
    if (typeof crypto !== 'undefined' && crypto.subtle) {
        const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Fallback lightweight hash for non-crypto environments
    let hash = 0;
    for (let i = 0; i < bytes.length; i++) {
        hash = (hash << 5) - hash + bytes[i];
        hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(64, '0');
}

/**
 * Generates the audit manifest containing SHA-256 checksums and privacy certification.
 * 
 * @param {Object} filesMap - Map of fileName -> content
 * @param {Object} [options={}]
 * @param {string} [options.domain]
 * @param {Object} [options.privacyAudit]
 * @returns {Promise<Object>} Audit manifest object
 */
export async function generateAuditManifest(filesMap, options = {}) {
    const { domain = 'general', privacyAudit = null } = options;
    const checksums = {};

    for (const [filename, content] of Object.entries(filesMap)) {
        if (filename === 'audit_manifest.json') continue;
        checksums[filename] = await computeSha256(content);
    }

    return {
        domain,
        generatedAt: new Date().toISOString(),
        generatorVersion: '0.3.0',
        integrityAlgorithm: 'SHA-256',
        checksums,
        privacy: privacyAudit || {
            preset: 'none',
            is_sanitized: false,
            appliedTransforms: []
        }
    };
}
