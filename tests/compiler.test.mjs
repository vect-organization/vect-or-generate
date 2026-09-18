// Copyright (c) 2026 1abcdefggs
// SPDX-License-Identifier: MIT
// Test suite for Knowledge Base Compiler Module (TDD Seam Test)

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compile, compileData, compileFile, normalizeEntity } from '../core/compiler/index.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock fast embedder (3-dim vector) for ultra-fast unit testing
function mockEmbedder(texts) {
  return texts.map((t, idx) => [0.1 * (idx + 1), 0.2, 0.3]);
}

async function runTests() {
  console.log('🧪 Running Compiler Module Tests (TDD Seam Verification)...\n');

  // --- Test 1: normalizeEntity ---
  console.log('Test 1: normalizeEntity assigns standard 10-layer defaults');
  const rawItem = {
    id: '#01',
    name: 'Test Term',
    definition: 'Test definition passage'
  };
  const normalized = normalizeEntity(rawItem, 0);
  assert.equal(normalized.id, '#01');
  assert.equal(normalized.name, 'Test Term');
  assert.equal(normalized.layer, 4);
  assert.equal(normalized.layerName, 'L4 Semantic / Definition');
  assert.equal(normalized.inEditor, true);
  assert.deepEqual(normalized.synonyms, []);
  assert.deepEqual(normalized.metadata, { source: null });
  console.log('  ✓ Passed\n');

  // --- Test 2: compileData (Pure In-Memory Mode) ---
  console.log('Test 2: compileData compiles raw entities with injected embedder');
  const rawEntities = [
    {
      id: '#01',
      name: 'Depression',
      definition: 'Mood disorder',
      layer: 4
    },
    {
      id: '#02',
      name: 'Linter Rule',
      definition: 'Safety rule',
      layer: 7
    }
  ];

  const result = await compileData(rawEntities, {
    domain: 'medical_test',
    prefix: '#',
    embedder: mockEmbedder
  });

  assert.equal(result.domain, 'medical_test');
  assert.equal(result.prefix, '#');
  assert.equal(result.version, '0.3.0');
  assert.equal(result.dimension, 3);
  assert.equal(result.metric, 'cosine');
  assert.equal(result.is_sanitized, false);
  assert.equal(result.fidelity_score, 100.0);
  assert.equal(result.entities.length, 2);
  assert.equal(result.entities[0].layerName, 'L4 Semantic / Definition');
  assert.equal(result.entities[1].layerName, 'L7 Linter / Rule');
  assert.deepEqual(result.entities[0].vector, [0.1, 0.2, 0.3]);
  console.log('  ✓ Passed\n');

  // --- Test 3: compile (Polymorphic file I/O Mode) ---
  console.log('Test 3: compile handles file input/output pipeline');
  const tmpDir = path.join(__dirname, 'tmp');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  const inputJsonPath = path.join(tmpDir, 'input_sample.json');
  const outputJsonPath = path.join(tmpDir, 'output_kb.json');

  fs.writeFileSync(inputJsonPath, JSON.stringify(rawEntities, null, 2), 'utf8');

  const fileResult = await compile({
    input: inputJsonPath,
    output: outputJsonPath,
    domain: 'file_pipeline_test',
    embedder: mockEmbedder
  });

  assert.equal(fileResult.count, 2);
  assert.equal(fileResult.domain, 'file_pipeline_test');
  assert.equal(fs.existsSync(outputJsonPath), true);

  const writtenPayload = JSON.parse(fs.readFileSync(outputJsonPath, 'utf8'));
  assert.equal(writtenPayload.domain, 'file_pipeline_test');
  assert.equal(writtenPayload.entities.length, 2);
  assert.deepEqual(writtenPayload.entities[0].vector, [0.1, 0.2, 0.3]);

  // Clean up tmp test files
  fs.unlinkSync(inputJsonPath);
  fs.unlinkSync(outputJsonPath);
  fs.rmdirSync(tmpDir);
  console.log('  ✓ Passed\n');

  // --- Test 4: Validation Error on Invalid Schema ---
  console.log('Test 4: compileData throws validation error on invalid input');
  await assert.rejects(
    async () => {
      await compileData([{ id: '#01' }], { embedder: mockEmbedder }); // Missing name and definition
    },
    /validation failed/i
  );
  console.log('  ✓ Passed\n');

  console.log('🎉 All Compiler TDD Seam Tests Passed Successfully!');
}

runTests().catch((err) => {
  console.error('❌ Test Failure:', err);
  process.exit(1);
});
