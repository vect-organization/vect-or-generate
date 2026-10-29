import test from 'node:test';
import assert from 'node:assert/strict';
import { encryptKnowledgeBase, decryptKnowledgeBase } from '../core/vault/index.js';
import crypto from 'node:crypto';
import { argon2id } from 'hash-wasm';
import { encryptKnowledgeBaseWeb, decryptKnowledgeBaseWeb } from '../core/vault/webVault.js';


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

    const enc = await encryptKnowledgeBaseWeb(data, password);
    const dec = await decryptKnowledgeBaseWeb(enc, password);
    assert.deepEqual(dec, data);
});

test('Vault: Node encrypt -> Web decrypt cross-compatibility', async () => {
    const data = { domain: 'cross', entities: [{ id: '#02', name: 'CrossTest' }] };
    const password = 'crossPassword456';

    const encNode = await encryptKnowledgeBase(data, password);
    const decWeb = await decryptKnowledgeBaseWeb(new Uint8Array(encNode), password);
    assert.deepEqual(decWeb, data);
});

test('Vault: Web encrypt -> Node decrypt cross-compatibility', async () => {
    const data = { domain: 'cross2', entities: [{ id: '#03', name: 'CrossTest2' }] };
    const password = 'crossPassword789';

    const encWeb = await encryptKnowledgeBaseWeb(data, password);
    const decNode = await decryptKnowledgeBase(Buffer.from(encWeb), password);
    assert.deepEqual(decNode, data);
});


// A file made by an earlier build with a per-machine VECTOR_APP_SECRET must still open
test('Vault: legacy per-machine secret still decrypts', async () => {
    const legacySecret = 'legacy-secret-for-test';
    process.env.VECTOR_APP_SECRET = legacySecret;
    const data = { domain: 'legacy', entities: [{ id: '#04', name: 'Legacy' }] };
    const password = 'legacyPassword';
    const salt = crypto.randomBytes(16);
    const iv = crypto.randomBytes(12);
    const blended = crypto.createHmac('sha256', legacySecret).update(password).digest('hex');
    const key = Buffer.from(await argon2id({ password: blended, salt, parallelism: 1, iterations: 3, memorySize: 65536, hashLength: 32, outputType: 'hex' }), 'hex');
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const body = Buffer.concat([cipher.update(JSON.stringify(data), 'utf8'), cipher.final()]);
    const file = Buffer.concat([Buffer.from('VENC'), salt, iv, cipher.getAuthTag(), body]);
    assert.deepEqual(await decryptKnowledgeBase(file, password), data);
});

test('Vault: wrong password is rejected', async () => {
    const enc = await encryptKnowledgeBase({ a: 1 }, 'right');
    await assert.rejects(() => decryptKnowledgeBase(enc, 'wrong'));
});
