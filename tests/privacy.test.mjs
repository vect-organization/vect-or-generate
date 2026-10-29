// Copyright (c) 2026 1abcdefggs
// SPDX-License-Identifier: MIT
// TDD Test Suite for Core Privacy & Differential Privacy Module

import assert from 'node:assert/strict';
import {
  injectSphericalNoise,
  detectSingularities,
  evaluatePrivacyMetrics,
  applyPrivacyTransforms,
  PRIVACY_PRESETS
} from '../core/privacy/index.mjs';

function computeNorm(vec) {
  return Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
}

function dotProduct(vecA, vecB) {
  return vecA.reduce((sum, a, idx) => sum + a * vecB[idx], 0);
}

async function runTests() {
  console.log('🧪 Running Core Privacy Engine TDD Seam Tests...\n');

  // --- Test 1: Spherical Tangent Projection DP (Norm Invariance & Perturbation) ---
  console.log('Test 1: injectSphericalNoise preserves L2 norm and introduces calibrated perturbation');
  const baseVector = [1, 0, 0, 0]; // 4-dim unit vector
  const noisyGaussian = injectSphericalNoise(baseVector, {
    epsilon: 0.05,
    mechanism: 'spherical_gaussian'
  });
  
  assert.equal(noisyGaussian.length, 4);
  const normG = computeNorm(noisyGaussian);
  assert.ok(Math.abs(normG - 1.0) < 1e-6, `Expected L2 norm ~ 1.0, got ${normG}`);
  
  const simG = dotProduct(baseVector, noisyGaussian);
  assert.ok(simG < 1.0 && simG > 0.95, `Expected slight perturbation (sim ~ 0.98), got ${simG}`);

  // Test Laplace mechanism on tangent plane
  const noisyLaplace = injectSphericalNoise(baseVector, {
    epsilon: 0.08,
    mechanism: 'laplace'
  });
  const normL = computeNorm(noisyLaplace);
  assert.ok(Math.abs(normL - 1.0) < 1e-6, `Expected Laplace norm ~ 1.0, got ${normL}`);
  console.log('  ✓ Passed\n');

  // --- Test 2: Singularity & Outlier Detection ---
  console.log('Test 2: detectSingularities identifies isolated entities in vector space');
  const clusterEntities = [
    { id: '#01', name: 'Major Depression', vector: [0.99, 0.05, 0.05, 0.05] },
    { id: '#02', name: 'Clinical Depression', vector: [0.98, 0.08, 0.06, 0.04] },
    { id: '#03', name: 'Dysthymia', vector: [0.97, 0.07, 0.08, 0.05] },
    // Isolated outlier (Singularity): orthogonal vector far from depression cluster
    { id: '#04', name: 'Rare Gene Mutation X', vector: [0.05, 0.99, 0.05, 0.05] }
  ];

  const singularityResult = detectSingularities(clusterEntities, { threshold: 0.50 });
  assert.equal(singularityResult.singularities.length, 1);
  assert.equal(singularityResult.singularities[0].item.id, '#04');
  assert.equal(singularityResult.singularities[0].riskLevel, 'HIGH');
  console.log('  ✓ Passed\n');

  // --- Test 3: Compliance Presets (hipaa_strict, balanced_oss, research_light) ---
  console.log('Test 3: applyPrivacyTransforms executes HIPAA strict preset with adaptive outlier protection');
  const sampleEntities = [
    {
      id: '#01',
      name: 'Bipolar Disorder',
      definition: 'Chronic mood condition.',
      vector: [0.95, 0.1, 0.1, 0.1],
      metadata: {
        source: { url: 'https://hospital.example.com/patient/42', raw_snippet: 'Private patient record...' }
      }
    },
    {
      id: '#02',
      name: 'Ultra Rare Syndrome Z',
      definition: 'Isolated unique case.',
      vector: [0.1, 0.95, 0.1, 0.1],
      metadata: { source: { url: 'https://hospital.example.com/patient/99' } }
    }
  ];

  const resultHipaa = await applyPrivacyTransforms(sampleEntities, {
    preset: 'hipaa_strict',
    computeMetrics: true
  });

  // Verify provenance stripped
  assert.equal(resultHipaa.entities[0].metadata.source, null);
  assert.equal(resultHipaa.entities[1].metadata.source, null);
  // Verify vectors are perturbed and normalized
  assert.ok(computeNorm(resultHipaa.entities[0].vector) > 0.999);
  // Verify metrics and singularity alerts included
  assert.ok(resultHipaa.metrics.privacyScore > 90.0);
  assert.ok(resultHipaa.metrics.fidelityScore > 85.0);
  assert.equal(resultHipaa.audit.preset, 'hipaa_strict');
  console.log('  ✓ Passed\n');

  // --- Test 4: Adaptive Sampling on Large Datasets ---
  console.log('Test 4: Adaptive sampling limits evaluation time on large collections');
  // Generate 1,200 dummy entities
  const largeEntities = Array.from({ length: 1200 }, (_, idx) => ({
    id: `#${idx + 1}`,
    name: `Entity ${idx + 1}`,
    vector: [0.7, 0.5, 0.3, 0.1]
  }));

  const sampledMetrics = evaluatePrivacyMetrics(largeEntities, largeEntities, {
    sampleLimit: 100
  });
  assert.equal(sampledMetrics.isSampled, true);
  assert.equal(sampledMetrics.sampleSize, 100);
  assert.equal(sampledMetrics.fidelityScore, 100.0);
  console.log('  ✓ Passed\n');

  console.log('🎉 All Core Privacy TDD Seam Tests Passed Successfully!');

  // --- Test 5: Regression - shuffleIdentifiers must not break outlier boost targeting ---
  // (ADR-0005 Phase1.4 fix: detectSingularities used to run pre-shuffle while the
  //  noise-injection step checked post-shuffle IDs, silently disabling the boost.)
  console.log('Test 5: Outlier noise boost still targets the correct item after ID shuffle');
  const normalize = (v) => {
    const n = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
    return v.map(x => x / n);
  };
  const clusterVec = normalize([0.9, 0.1, 0.05, 0.02]);
  const outlierVec = normalize([-0.8, 0.9, -0.7, 0.85]); // far from the cluster -> should be flagged as singularity
  const regressionEntities = [
    { id: '#001', name: 'Cluster A', vector: clusterVec },
    { id: '#002', name: 'Cluster B', vector: clusterVec.map(v => v * 0.98) },
    { id: '#003', name: 'Cluster C', vector: clusterVec.map(v => v * 1.02) },
    { id: '#OUTLIER', name: 'Outlier', vector: outlierVec },
  ];

  const displacement = (before, after) => {
    let sum = 0;
    for (let i = 0; i < before.length; i++) sum += (before[i] - after[i]) ** 2;
    return Math.sqrt(sum);
  };

  async function meanOutlierDisplacement(shuffleIdentifiers, boostSingularity) {
    const trials = 200;
    let total = 0;
    for (let t = 0; t < trials; t++) {
      const { entities: out } = await applyPrivacyTransforms(regressionEntities, {
        stripProvenance: false,
        anonymizeSyntax: false,
        shuffleIdentifiers,
        injectNoise: true,
        boostSingularity,
        epsilon: 0.05,
      });
      const outlierAfter = out.find(e => e.name === 'Outlier');
      total += displacement(outlierVec, outlierAfter.vector);
    }
    return total / trials;
  }

  const dispNoBoost = await meanOutlierDisplacement(false, false);
  const dispBoostNoShuffle = await meanOutlierDisplacement(false, true);
  const dispBoostWithShuffle = await meanOutlierDisplacement(true, true);

  // Boost (1.5x epsilon) should measurably increase displacement over the
  // no-boost baseline, AND this must hold whether or not IDs were shuffled.
  // Before the fix, dispBoostWithShuffle collapsed to ~dispNoBoost because
  // outlierIdSet (built from pre-shuffle entities) never matched any
  // post-shuffle item.id, so the boost silently never applied when shuffle was on.
  const boostRatioNoShuffle = dispBoostNoShuffle / dispNoBoost;
  const boostRatioWithShuffle = dispBoostWithShuffle / dispNoBoost;
  assert.ok(boostRatioNoShuffle > 1.15,
    `Boost should raise displacement without shuffle (ratio=${boostRatioNoShuffle.toFixed(3)})`);
  assert.ok(boostRatioWithShuffle > 1.15,
    `Boost should raise displacement WITH shuffle too (ratio=${boostRatioWithShuffle.toFixed(3)}) — regression for the __origRef fix`);
  console.log(`  ✓ Passed (noBoost=${dispNoBoost.toFixed(4)}, boost/no-shuffle=${dispBoostNoShuffle.toFixed(4)} x${boostRatioNoShuffle.toFixed(2)}, boost/shuffle=${dispBoostWithShuffle.toFixed(4)} x${boostRatioWithShuffle.toFixed(2)})\n`);

  console.log('🎉 All Core Privacy TDD Seam Tests Passed Successfully (incl. regression)!');
}

runTests().catch((err) => {
  console.error('❌ Test Failure:', err);
  process.exit(1);
});
