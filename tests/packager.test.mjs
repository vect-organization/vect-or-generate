// Copyright (c) 2026 1abcdefggs
// SPDX-License-Identifier: MIT
// TDD Test Suite for Unified 3-Artifact (+ Safetensors & Audit) Packager Module

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  packageArtifactBundle,
  exportArtifactsToDisk,
  parseSafetensorsHeader
} from '../core/packager/index.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTests() {
  console.log('🧪 Running Artifact Packager TDD Seam Tests...\n');

  const domain = 'medical_psychiatry';
  const mockEntities = [
    {
      id: '#01',
      name: 'Major Depression',
      reading: 'depression',
      definition: 'Persistent depressed mood and loss of interest.',
      layer: 4,
      layerName: 'L4 Semantic / Definition',
      category: 'Affective Disorder',
      code: 'F32.9',
      synonyms: ['Clinical Depression', 'Unipolar Depression'],
      inEditor: true,
      metadata: { source: null },
      vector: [0.1, 0.2, 0.3, 0.4] // 4-dim Float32 vector
    },
    {
      id: '#02',
      name: 'Safety Rule 1',
      reading: 'rule',
      definition: 'High-risk terminology must include clinical disclaimer.',
      layer: 7,
      layerName: 'L7 Linter / Rule',
      category: 'Safety',
      code: 'RULE-01',
      synonyms: [],
      inEditor: true,
      metadata: { source: null },
      vector: [0.5, 0.6, 0.7, 0.8]
    }
  ];

  // --- Test 1: Memory Bundle Generation (All 5 Artifacts) ---
  console.log('Test 1: packageArtifactBundle creates all 5 standard artifacts in memory');
  const bundle = await packageArtifactBundle({
    entities: mockEntities,
    domain,
    taxonomyCode: 'ICD-10 / J-MIX',
    privacyAudit: {
      preset: 'hipaa_strict',
      appliedTransforms: ['strip_provenance', 'spherical_dp_gaussian_eps0.04'],
      timestamp: '2026-08-23T00:00:00.000Z'
    }
  });

  assert.equal(bundle.domain, domain);
  assert.equal(bundle.itemCount, 2);
  assert.ok(bundle.files, 'Bundle must contain files map');

  // 1. Verify kb_medical_psychiatry.json
  const kbFileName = `kb_${domain}.json`;
  assert.ok(bundle.files[kbFileName], `Expected ${kbFileName}`);
  assert.equal(bundle.files[kbFileName].domain, domain);
  assert.equal(bundle.files[kbFileName].entities.length, 2);

  // 2. Verify kb_medical_psychiatry.safetensors (Binary buffer)
  const stFileName = `kb_${domain}.safetensors`;
  assert.ok(bundle.files[stFileName], `Expected ${stFileName}`);
  assert.ok(bundle.files[stFileName] instanceof Uint8Array, 'Safetensors file must be a binary Uint8Array');
  
  // Verify Safetensors header metadata
  const stHeader = parseSafetensorsHeader(bundle.files[stFileName]);
  assert.ok(stHeader.embeddings, 'Safetensors header must contain embeddings tensor metadata');
  assert.deepEqual(stHeader.embeddings.shape, [2, 4]); // 2 entities, 4 dimensions
  assert.equal(stHeader.embeddings.dtype, 'F32');

  // 3. Verify guideline_medical_psychiatry.json (Linter profile)
  const guidelineFileName = `guideline_${domain}.json`;
  assert.ok(bundle.files[guidelineFileName], `Expected ${guidelineFileName}`);
  assert.equal(bundle.files[guidelineFileName].domain, domain);
  assert.ok(Array.isArray(bundle.files[guidelineFileName].rules), 'Guideline must contain rules array');
  assert.ok(bundle.files[guidelineFileName].rules.length >= 2, 'Should extract synonym & layer rules');

  // 4. Verify ime_medical_psychiatry.txt (4-column TSV)
  const imeFileName = `ime_${domain}.txt`;
  assert.ok(bundle.files[imeFileName], `Expected ${imeFileName}`);
  const imeText = bundle.files[imeFileName];
  const imeLines = imeText.trim().split('\n');
  assert.equal(imeLines.length, 2);
  const firstLineCols = imeLines[0].split('\t');
  assert.equal(firstLineCols[0], 'depression'); // Reading
  assert.equal(firstLineCols[1], 'Major Depression'); // Name
  assert.ok(firstLineCols[2].includes('L4'), 'Column 3 must include layer information');

  // 5. Verify audit_manifest.json (SHA-256 Checksums)
  const auditFileName = 'audit_manifest.json';
  assert.ok(bundle.files[auditFileName], `Expected ${auditFileName}`);
  assert.equal(bundle.files[auditFileName].domain, domain);
  assert.ok(bundle.files[auditFileName].checksums[kbFileName], 'Must contain SHA-256 for kb JSON');
  assert.ok(bundle.files[auditFileName].checksums[stFileName], 'Must contain SHA-256 for safetensors');
  assert.equal(bundle.files[auditFileName].privacy.preset, 'hipaa_strict');
  console.log('  ✓ Passed\n');

  // --- Test 2: Disk Export ---
  console.log('Test 2: exportArtifactsToDisk writes all 5 files to target directory');
  const tmpDir = path.join(__dirname, 'tmp_export');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  const writtenFiles = await exportArtifactsToDisk(bundle, tmpDir);
  assert.equal(writtenFiles.length, 5);
  for (const filePath of writtenFiles) {
    assert.ok(fs.existsSync(filePath), `File should exist on disk: ${filePath}`);
    fs.unlinkSync(filePath); // Clean up
  }
  fs.rmdirSync(tmpDir);
  console.log('  ✓ Passed\n');

  console.log('🎉 All Artifact Packager TDD Seam Tests Passed Successfully!');
}

runTests().catch((err) => {
  console.error('❌ Test Failure:', err);
  process.exit(1);
});
