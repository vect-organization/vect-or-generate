// Copyright (c) 2026 1abcdefggs
// SPDX-License-Identifier: MIT
// lexicon_recipe: keyed objects become record lists, a second file joins by key, dot-path fields resolve.

import assert from 'node:assert/strict';
import { toRecordList, applyJoins, mapRecords } from '../recipes/lexicon_recipe.mjs';

console.log('Test 1: an object keyed by id becomes records carrying _key');
const list = toRecordList({ A1: { heading: 'one' }, B2: { heading: 'two' } });
assert.deepEqual(list.map(r => r._key), ['A1', 'B2']);
assert.deepEqual(toRecordList([{ a: 1 }]), [{ a: 1 }]);
assert.deepEqual(toRecordList(null), []);

console.log('Test 2: a join attaches the record whose key equals the main record field');
const main = [{ code: 'A1', name: 'x' }, { code: 'Z9', name: 'y' }];
const joined = applyJoins(main, [{ input: 'n.json', by: 'code', as: 'notice' }], '.', () => ({ A1: { heading: 'one', text: 'body' } }));
assert.equal(joined[0].notice.text, 'body');
assert.equal(joined[1].notice, undefined);

console.log('Test 3: mapRecords reads dot-path fields and metadata');
const e = mapRecords(joined, {
    fields: { id: 'code', name: 'name', definition: 'notice.text' },
    metadata: { heading: 'notice.heading' },
    vectorText: ['name', 'definition']
});
assert.equal(e[0].definition, 'body');
assert.equal(e[0].metadata.heading, 'one');
assert.equal(e[1].definition, '');
assert.equal(e[0].text_for_vector, 'x / body');

console.log('Test 4: nameParts joins source fields into the name and skips blank parts');
const n = mapRecords([{ k: '1', title: 'Art 1', caption: '(Purpose)' }, { k: '2', title: 'Art 2', caption: '' }], {
    fields: { id: 'k', name: 'title' },
    nameParts: ['title', 'caption'],
    vectorText: ['name']
});
assert.equal(n[0].name, 'Art 1 (Purpose)');
assert.equal(n[1].name, 'Art 2');
assert.equal(n[0].text_for_vector, 'Art 1 (Purpose)');

console.log('lexiconJoin tests passed');
