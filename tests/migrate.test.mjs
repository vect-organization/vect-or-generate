// Copyright (c) 2026 1abcdefggs
// SPDX-License-Identifier: MIT
// ADR-0005 Phase5: migration, v2 semantic validation, and v2 -> runtime projection.

import assert from 'node:assert/strict';
import { migrateKbV1ToV2 } from '../scripts/migrate-v1-to-v2.mjs';
import { validateKnowledgeBaseV2 } from '../core/validator.mjs';
import { normalizeKbPayload } from '../core/compiler/projectV2.mjs';
import { loadFacetRegistry } from '../core/registryLoader.mjs';

const v384 = (seed) => Array.from({ length: 384 }, (_, i) => (i === seed ? 1 : 0));

const v1 = {
    domain: 'psy', schemaVersion: '0.3.0', prefix: '#', dimension: 384,
    entities: [
        { id: '#001', name: '双極性障害', reading: 'そうきょくせいしょうがい', definition: '気分の波が大きい', layer: 4,
          code: 'ICD-10-CM: F31', synonyms: ['躁うつ病'], category: '精神疾患', inEditor: true,
          metadata: { source: { type: 'manual', title: 'DSM-5-TR', url: 'https://example.org', raw_snippet: 'x' } }, vector: v384(0) },
        { id: '#002', name: 'ルールA', layer: 7, code: 'BARECODE', vector: v384(1) },
        { id: '#003', name: '未登録層', layer: 99, vector: v384(2) },
    ],
};

async function run() {
    console.log('Test 1: scheme-qualified ids, notations split, forms[] carries reading');
    const { v2Doc, warnings } = migrateKbV1ToV2(v1, { lang: 'ja' });
    const c1 = v2Doc.concepts[0];
    assert.equal(c1.id, 'c:psy:001');
    assert.deepEqual(c1.notations.find(n => n.scheme === 'ICD-10-CM'), { scheme: 'ICD-10-CM', value: 'F31' });
    assert.equal(c1.facet, 'F.concept');
    assert.equal(v2Doc.forms[0].reading[0].value, 'そうきょくせいしょうがい');
    assert.deepEqual(v2Doc.forms[0].senses, [c1.senses[0].id]);
    assert.equal(c1.labels[0].provenance.url, 'https://example.org');
    console.log('  ✓ Passed');

    console.log('Test 2: nothing dropped (legacy bucket, unmapped layer kept + warned)');
    assert.equal(c1.legacy.inEditor, true);
    assert.equal(c1.legacy.rawSnippet, 'x');
    const c3 = v2Doc.concepts[2];
    assert.equal(c3.layer, 99);
    assert.ok(warnings.some(w => w.includes('layer 99')));
    console.log('  ✓ Passed');

    console.log('Test 3: multi-facet legacy layer (L7) surfaces candidates + warning');
    const c2 = v2Doc.concepts[1];
    const reg = loadFacetRegistry();
    const l7 = Object.keys(reg).filter(k => String(reg[k].legacy || '').split('/').includes('L7'));
    assert.deepEqual(c2.facetCandidates, l7);
    assert.ok(warnings.some(w => w.includes('needs review')));
    console.log('  ✓ Passed');

    console.log('Test 4: lang defaults to und with a warning (no silent ja assumption)');
    const r2 = migrateKbV1ToV2(v1);
    assert.equal(r2.v2Doc.concepts[0].labels[0].lang, 'und');
    assert.ok(r2.warnings.some(w => w.includes("'und'")));
    console.log('  ✓ Passed');

    console.log('Test 5: validateKnowledgeBaseV2 catches registry/referential errors');
    const bad = { concepts: [
        { id: 'c:x:1', notations: [], depth: 0, labels: [], facet: 'F.nope', relations: [{ type: 'notARelation', target: 'c:x:2' }],
          embeddings: [{ facet: 'F.embedding.e5small', dim: 3, vector: [0, 0] }] },
        { id: 'c:x:1', notations: [], depth: 0, labels: [] },
    ], forms: [{ id: 'f:1', writtenForm: 'a', senses: ['s:missing'] }] };
    const res = validateKnowledgeBaseV2(bad);
    assert.equal(res.isValid, false);
    for (const needle of ['duplicate concept id', 'facet not registered', 'relation type not in registry', 'dim field', 'sense id not found']) {
        assert.ok(res.errors.some(e => e.includes(needle)), `expected error: ${needle}`);
    }
    assert.ok(res.warnings.some(w => w.includes('internal relation target')));
    assert.equal(validateKnowledgeBaseV2(v2Doc).isValid, true);
    console.log('  ✓ Passed');

    console.log('Test 6: normalizeKbPayload yields Engine-loadable items for every shape');
    for (const [payload, fmt] of [[v1.entities, 'array'], [v1, 'entities'], [v2Doc, 'concepts']]) {
        const n = normalizeKbPayload(payload);
        assert.equal(n.format, fmt);
        assert.equal(n.items.length, 3);
        for (const it of n.items) {
            assert.ok(it.id, 'id required by KnowledgeItem');
            assert.ok(Array.isArray(it.vector) && it.vector.length === 384, 'vector required by KnowledgeItem');
        }
    }
    const proj = normalizeKbPayload(v2Doc).items[0];
    assert.equal(proj.name, '双極性障害');
    assert.equal(proj.reading, 'そうきょくせいしょうがい');
    assert.equal(proj.code, 'ICD-10-CM: F31');
    assert.deepEqual(proj.synonyms, ['躁うつ病']);
    assert.equal(normalizeKbPayload({ foo: 1 }).format, 'unknown');
    console.log('  ✓ Passed');

    console.log('\n🎉 migrate / validateKnowledgeBaseV2 / projectV2 tests passed');
}

run().catch((err) => { console.error('❌ Test Failure:', err); process.exitCode = 1; });
