// Copyright (c) 2026 1abcdefggs
// SPDX-License-Identifier: MIT
// Schema v2 embedding pass: vectors attach per facet, stubs are skipped, projection to runtime items works.

import assert from 'node:assert/strict';
import { embedConceptsV2, conceptTextForVector, isV2Document } from '../core/compiler/embedV2.mjs';
import { normalizeKbPayload } from '../core/compiler/projectV2.mjs';

const fakeEmbedder = async (texts) => texts.map((_, i) => Array.from({ length: 384 }, (__, j) => (j === i % 384 ? 1 : 0)));

const doc = {
    domain: 'ui', schemaVersion: '2.0-draft', prefix: '#',
    concepts: [
        { id: 'c:a:Header', notations: [], broader: [], labels: [{ kind: 'pref', lang: 'en', text: 'Header' }], facet: 'F.concept', stub: true },
        { id: 'c:b:logo', notations: [{ scheme: 'data-ui', value: 'hdr:logo' }], broader: [], facet: 'F.concept',
          labels: [{ kind: 'pref', lang: 'ja', text: 'ロゴ' }, { kind: 'pref', lang: 'en', text: 'Logo' }],
          senses: [{ id: 's:b', definition: 'App logo and version' }] },
        { id: 'c:c:none', notations: [], broader: [], labels: [], facet: 'F.concept' },
    ],
};

async function run() {
    console.log('Test 1: text for vector joins labels and definition, stubs and label-less concepts give nothing');
    assert.equal(conceptTextForVector(doc.concepts[1]), 'ロゴ / Logo / App logo and version');
    assert.equal(conceptTextForVector(doc.concepts[0]), '');
    assert.equal(conceptTextForVector(doc.concepts[2]), '');
    assert.equal(isV2Document(doc), true);
    assert.equal(isV2Document([]), false);

    console.log('Test 2: embeddings attach to the e5small facet, input is not mutated');
    const r = await embedConceptsV2(doc, { embedder: fakeEmbedder });
    assert.equal(r.facet, 'F.embedding.e5small');
    assert.equal(r.embedded, 1);
    assert.equal(r.skipped, 2);
    assert.equal(doc.concepts[1].embeddings, undefined);
    const emb = r.doc.concepts[1].embeddings[0];
    assert.equal(emb.facet, 'F.embedding.e5small');
    assert.equal(emb.dim, 384);
    assert.equal(r.doc.concepts[0].embeddings, undefined);

    console.log('Test 3: rerun replaces the same facet instead of duplicating');
    const again = await embedConceptsV2(r.doc, { embedder: fakeEmbedder });
    assert.equal(again.doc.concepts[1].embeddings.length, 1);

    console.log('Test 4: the result projects to runtime items (what vect-or-edit loads)');
    const p = normalizeKbPayload(r.doc);
    assert.equal(p.items.length, 1);
    assert.equal(p.items[0].vector.length, 384);

    console.log('Test 5: unknown model and non-v2 input are rejected');
    await assert.rejects(() => embedConceptsV2(doc, { modelName: 'nobody/unknown-model', embedder: fakeEmbedder }), /no embedding facet/);
    await assert.rejects(() => embedConceptsV2({ entities: [] }, { embedder: fakeEmbedder }), /schema v2/);

    console.log('embedV2 tests passed');
}

run().catch(e => { console.error(e); process.exit(1); });
