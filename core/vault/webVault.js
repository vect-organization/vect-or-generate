// Copyright (c) 2026 1abcdefggs
// SPDX-License-Identifier: MIT
// Isomorphic / Browser-compatible Vault module for Generator Studio & Web apps

import { argon2id } from "hash-wasm";

const DEFAULT_APP_SECRET = "VECTOR_APP_DEFAULT_SECRET_2026";

/**
 * Derives an AES-256-GCM key from password and salt using Argon2id + HMAC-SHA256.
 * Browser & Node.js environment compatible.
 */
export async function deriveKeyWeb(userPassword, salt, appSecret = DEFAULT_APP_SECRET) {
  let blendedHex = "";
  
  if (typeof crypto !== "undefined" && crypto.subtle) {
    // Browser Web Crypto API HMAC-SHA256
    const enc = new TextEncoder();
    const keyData = enc.encode(appSecret);
    const hmacKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: { name: "SHA-256" } },
      false,
      ["sign"]
    );
    const signature = await crypto.subtle.sign("HMAC", hmacKey, enc.encode(userPassword));
    blendedHex = Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } else {
    // Fallback if imported in Node without global crypto.subtle
    const nodeCrypto = await import("crypto");
    blendedHex = nodeCrypto.createHmac("sha256", appSecret).update(userPassword).digest("hex");
  }

  const keyHex = await argon2id({
    password: blendedHex,
    salt: salt instanceof Uint8Array ? salt : new Uint8Array(salt),
    parallelism: 1,
    iterations: 3,
    memorySize: 65536, // 64 MiB
    hashLength: 32,
    outputType: "hex",
  });

  const match = keyHex.match(/.{1,2}/g);
  return new Uint8Array(match.map((byte) => parseInt(byte, 16)));
}

/**
 * Encrypt a JSON object to .venc binary buffer in the browser.
 * Compatible with Node.js decryptKnowledgeBase format:
 * [MAGIC 4B ("VENC") | SALT 16B | IV 12B | AUTHTAG 16B | CIPHERTEXT NB]
 * 
 * @param {Object} jsonData 
 * @param {string} userPassword 
 * @param {string} [appSecret]
 * @returns {Promise<Uint8Array>}
 */
export async function encryptKnowledgeBaseWeb(jsonData, userPassword, appSecret = DEFAULT_APP_SECRET) {
  if (!userPassword) {
    throw new Error("Password is required for encryption.");
  }

  const salt = new Uint8Array(16);
  const iv = new Uint8Array(12);
  crypto.getRandomValues(salt);
  crypto.getRandomValues(iv);

  const rawKey = await deriveKeyWeb(userPassword, salt, appSecret);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    rawKey,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );

  const plaintext = JSON.stringify(jsonData);
  const encodedPlaintext = new TextEncoder().encode(plaintext);

  // Web Crypto encrypt produces ciphertext + 16-byte auth tag at the end
  const encryptedWithTag = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
      tagLength: 128,
    },
    cryptoKey,
    encodedPlaintext
  );

  const encryptedBuf = new Uint8Array(encryptedWithTag);
  const tagLen = 16;
  const ciphertextLen = encryptedBuf.length - tagLen;

  const ciphertext = encryptedBuf.subarray(0, ciphertextLen);
  const authTag = encryptedBuf.subarray(ciphertextLen);

  const magic = new TextEncoder().encode("VENC"); // 4 bytes

  const totalLength = 4 + 16 + 12 + 16 + ciphertext.length;
  const result = new Uint8Array(totalLength);

  let offset = 0;
  result.set(magic, offset); offset += 4;
  result.set(salt, offset); offset += 16;
  result.set(iv, offset); offset += 12;
  result.set(authTag, offset); offset += 16;
  result.set(ciphertext, offset);

  return result;
}

/**
 * Decrypt a .venc Uint8Array back to JSON object in the browser.
 * 
 * @param {Uint8Array} fileData 
 * @param {string} userPassword 
 * @param {string} [appSecret]
 * @returns {Promise<Object>}
 */
export async function decryptKnowledgeBaseWeb(fileData, userPassword, appSecret = DEFAULT_APP_SECRET) {
  const magic = new TextDecoder().decode(fileData.subarray(0, 4));
  if (magic !== "VENC") {
    throw new Error("Invalid file format: Missing VENC header.");
  }

  const salt = fileData.subarray(4, 20);
  const iv = fileData.subarray(20, 32);
  const authTag = fileData.subarray(32, 48);
  const ciphertext = fileData.subarray(48);

  const rawKey = await deriveKeyWeb(userPassword, salt, appSecret);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    rawKey,
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );

  // Combine ciphertext + authTag for Web Crypto decrypt
  const combined = new Uint8Array(ciphertext.length + authTag.length);
  combined.set(ciphertext, 0);
  combined.set(authTag, ciphertext.length);

  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv,
      tagLength: 128,
    },
    cryptoKey,
    combined
  );

  const jsonStr = new TextDecoder().decode(decryptedBuffer);
  return JSON.parse(jsonStr);
}
