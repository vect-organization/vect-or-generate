// Copyright (c) 2026 1abcdefggs
// SPDX-License-Identifier: MIT
// TDD Test Suite for Inference Engine Module

import assert from 'node:assert/strict';
import { createInferenceEngine } from '../studio/src/services/inferenceEngine.js';

async function runTests() {
  console.log('🧪 Running Inference Engine TDD Seam Tests...\n');

  // Test 1: Pseudo Engine Ranking & Embedding
  console.log('Test 1: Inference Engine embeds and ranks entities in pseudo mode');
  const engine = createInferenceEngine({ initialMode: 'pseudo' });

  const sampleEntities = [
    { id: '#01', name: 'Major Depression', definition: 'Persistent sadness and lack of interest.' },
    { id: '#02', name: 'Schizophrenia', definition: 'Disconnection from reality with delusions.' },
    { id: '#03', name: 'Insomnia', definition: 'Sleep disorder difficulty falling asleep.' }
  ];

  // Initialize embeddings
  const embeddedEntities = await engine.embedAll(sampleEntities);
  assert.equal(embeddedEntities.length, 3);
  assert.equal(embeddedEntities[0].vector.length, 384);

  // Search/Rank query
  const query = 'Major Depression';
  const scored = await engine.rankMatches(query, embeddedEntities, { limit: 2 });

  assert.equal(scored.length, 2);
  assert.equal(scored[0].id, '#01'); // Exact matching entity should rank highest
  assert.ok(scored[0].similarity >= scored[1].similarity);
  console.log('  ✓ Passed\n');

  // Test 2: Status & Progress Subscriptions
  console.log('Test 2: Engine notifies subscribers on status and progress changes');
  let lastStatus = null;
  const unsubscribe = engine.subscribeStatus((status) => {
    lastStatus = status;
  });

  engine.setStatus('ready');
  assert.equal(lastStatus, 'ready');
  unsubscribe();

  engine.setStatus('idle');
  assert.equal(lastStatus, 'ready'); // Unsubscribed, should not update
  console.log('  ✓ Passed\n');

  console.log('🎉 All Inference Engine TDD Seam Tests Passed Successfully!');
}

runTests().catch((err) => {
  console.error('❌ Test Failure:', err);
  process.exit(1);
});
