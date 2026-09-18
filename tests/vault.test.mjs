import test from 'node:test';
import assert from 'node:assert/strict';
import { encryptKnowledgeBase, decryptKnowledgeBase } from '../core/vault/index.js';
import { encryptKnowledgeBaseWeb, decryptKnowledgeBaseWeb } from '../core/vault/webVault.js';

const APP_SECRET = process.env.VECTOR_APP_SECRET || "6bf239ef8b8a496e673a2121ebc47cd9f4040a71b92855f8ee88646a618a3abc";

test('Vault: Node encrypt -> Node decrypt', async () => {
    const data = { domain: 'medical', entities: [{ id: '#01', name: 'Test' }] };
    const password = 'mySecretPassword123';

    const enc = await encryptKnowledgeBase(data, password);
    const dec = await decryptKnowledgeBase(enc, password);
    assert.deepEqual(dec, data);
});

test('Vault: Web encrypt -> Web decrypt', async () => {
    const data = { domain: 'medical', entities: [{ id: '#01', name: 'Test' }] };
    const password = 'mySecretPassword123';

    const enc = await encryptKnowledgeBaseWeb(data, password, APP_SECRET);
    const dec = await decryptKnowledgeBaseWeb(enc, password, APP_SECRET);
    assert.deepEqual(dec, data);
});

test('Vault: Node encrypt -> Web decrypt cross-compatibility', async () => {
    const data = { domain: 'cross', entities: [{ id: '#02', name: 'CrossTest' }] };
    const password = 'crossPassword456';

    const encNode = await encryptKnowledgeBase(data, password);
    const decWeb = await decryptKnowledgeBaseWeb(new Uint8Array(encNode), password, APP_SECRET);
    assert.deepEqual(decWeb, data);
});

test('Vault: Web encrypt -> Node decrypt cross-compatibility', async () => {
    const data = { domain: 'cross2', entities: [{ id: '#03', name: 'CrossTest2' }] };
    const password = 'crossPassword789';

    const encWeb = await encryptKnowledgeBaseWeb(data, password, APP_SECRET);
    const decNode = await decryptKnowledgeBase(Buffer.from(encWeb), password);
    assert.deepEqual(decNode, data);
});
