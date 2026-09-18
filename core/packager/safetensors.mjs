// Copyright (c) 2026 1abcdefggs
// SPDX-License-Identifier: MIT
// Zero-Dependency Safetensors Binary Serializer & Parser
// Conforms to Hugging Face Safetensors Standard (8-byte header length + JSON metadata + contiguous Float32 buffer)

/**
 * Serializes an entity collection with float vectors into a standard Safetensors binary format (Uint8Array).
 * 
 * @param {Array<Object>} entities - Entity collection with .vector properties
 * @param {Object} [metadata={}] - Optional metadata key-values
 * @returns {Uint8Array} Binary Safetensors buffer
 */
export function serializeToSafetensors(entities, metadata = {}) {
    if (!Array.isArray(entities) || entities.length === 0) {
        throw new Error('serializeToSafetensors: expected non-empty entities array');
    }

    const count = entities.length;
    const dim = entities[0].vector?.length || 384;
    const totalFloats = count * dim;
    const tensorByteLength = totalFloats * 4; // 4 bytes per Float32

    // 1. Flatten all entity vectors into a single contiguous Float32Array
    const floatArray = new Float32Array(totalFloats);
    for (let i = 0; i < count; i++) {
        const v = entities[i].vector;
        if (v && v.length === dim) {
            floatArray.set(v, i * dim);
        }
    }

    // 2. Construct Safetensors JSON header metadata
    const headerObj = {
        embeddings: {
            dtype: "F32",
            shape: [count, dim],
            data_offsets: [0, tensorByteLength]
        },
        __metadata__: {
            format: "pt",
            itemCount: String(count),
            dimension: String(dim),
            generatedBy: "VectOrGenerate-v0.3.0",
            ...metadata
        }
    };

    const encoder = new TextEncoder();
    const headerBytes = encoder.encode(JSON.stringify(headerObj));
    const headerLen = headerBytes.length;

    // 3. Allocate total buffer: 8 bytes (header length) + headerBytes + tensorBytes
    const totalBufferSize = 8 + headerLen + tensorByteLength;
    const finalBuffer = new Uint8Array(totalBufferSize);

    // 4. Write 8-byte Little-Endian integer for header length
    const view = new DataView(finalBuffer.buffer);
    // Write 64-bit integer as low 32-bit and high 32-bit
    view.setUint32(0, headerLen, true);
    view.setUint32(4, 0, true);

    // 5. Copy header bytes
    finalBuffer.set(headerBytes, 8);

    // 6. Copy tensor Float32 bytes
    const tensorBytes = new Uint8Array(floatArray.buffer, floatArray.byteOffset, tensorByteLength);
    finalBuffer.set(tensorBytes, 8 + headerLen);

    return finalBuffer;
}

/**
 * Parses the header of a Safetensors binary buffer.
 * @param {Uint8Array} buffer 
 * @returns {Object} Parsed JSON header object
 */
export function parseSafetensorsHeader(buffer) {
    if (!buffer || buffer.length < 8) {
        throw new Error('Invalid Safetensors buffer: too small');
    }

    const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    const headerLen = view.getUint32(0, true);

    const decoder = new TextDecoder();
    const headerJsonStr = decoder.decode(buffer.subarray(8, 8 + headerLen));
    return JSON.parse(headerJsonStr);
}
