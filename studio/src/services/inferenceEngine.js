// Copyright (c) 2026 1abcdefggs
// SPDX-License-Identifier: MIT
// Deep Inference Engine Module (Unified WebWorker ONNX & Pseudo Fallback Seam)

import { cosineSimilarity, pseudoEmbedText } from './vectorMath.js';

export class InferenceEngine {
    constructor(options = {}) {
        this.mode = options.initialMode || 'pseudo'; // 'pseudo' | 'onnx'
        this.status = 'idle'; // 'idle' | 'loading' | 'ready' | 'error'
        this.progress = null;
        this.worker = null;
        this.statusListeners = new Set();
        this.progressListeners = new Set();
        this.errorListeners = new Set();

        this._pendingPromises = new Map(); // messageId -> { resolve, reject }
        this._msgSeq = 0;
    }

    /**
     * Initializes the Web Worker if running in a browser environment supporting Web Workers.
     */
    initWorker(workerUrl = null) {
        if (typeof Worker === 'undefined') {
            return false; // In Node.js or SSR environment
        }

        if (!this.worker) {
            try {
                const url = workerUrl || new URL('./worker.js', import.meta.url);
                this.worker = new Worker(url, { type: 'module' });
                this._bindWorkerEvents();
            } catch (err) {
                console.warn('[InferenceEngine] WebWorker initialization failed, falling back to pseudo mode:', err);
                return false;
            }
        }
        return true;
    }

    _bindWorkerEvents() {
        if (!this.worker) return;

        this.worker.onmessage = (event) => {
            const { type, status, progress, entities, queryVector, error } = event.data;

            if (type === 'STATUS') {
                this.setStatus(status);
                if (status === 'ready' || status === 'loading') this.setProgress(null);
            } else if (type === 'PROGRESS' || type === 'MODEL_DOWNLOAD_PROGRESS') {
                this.setProgress(progress);
            } else if (type === 'EMBED_ALL_DONE') {
                this.setStatus('ready');
                this.setProgress(null);
                const resolver = this._pendingPromises.get('EMBED_ALL');
                if (resolver) {
                    resolver.resolve(entities);
                    this._pendingPromises.delete('EMBED_ALL');
                }
            } else if (type === 'EMBED_QUERY_DONE') {
                const resolver = this._pendingPromises.get('EMBED_QUERY');
                if (resolver) {
                    resolver.resolve(queryVector);
                    this._pendingPromises.delete('EMBED_QUERY');
                }
            } else if (type === 'ERROR') {
                console.error('[InferenceEngine] Worker Error:', error);
                this.setStatus('error');
                this._notifyErrors(error);
                for (const [, resolver] of this._pendingPromises) {
                    resolver.reject(new Error(error));
                }
                this._pendingPromises.clear();
            }
        };
    }

    setMode(mode) {
        this.mode = mode;
        if (mode === 'onnx' && !this.worker) {
            this.initWorker();
        }
    }

    setStatus(status) {
        this.status = status;
        for (const cb of this.statusListeners) cb(status);
    }

    setProgress(progress) {
        this.progress = progress;
        for (const cb of this.progressListeners) cb(progress);
    }

    _notifyErrors(error) {
        for (const cb of this.errorListeners) cb(error);
    }

    subscribeStatus(callback) {
        this.statusListeners.add(callback);
        return () => this.statusListeners.delete(callback);
    }

    subscribeProgress(callback) {
        this.progressListeners.add(callback);
        return () => this.progressListeners.delete(callback);
    }

    subscribeError(callback) {
        this.errorListeners.add(callback);
        return () => this.errorListeners.delete(callback);
    }

    /**
     * Computes embeddings for all entities in batch.
     * @param {Array<Object>} entities 
     * @returns {Promise<Array<Object>>}
     */
    async embedAll(entities) {
        if (!Array.isArray(entities)) return [];

        if (this.mode === 'onnx' && this.worker) {
            this.setStatus('embedding_entities');
            return new Promise((resolve, reject) => {
                this._pendingPromises.set('EMBED_ALL', { resolve, reject });
                this.worker.postMessage({ type: 'LOAD_MODEL' });
                this.worker.postMessage({ type: 'EMBED_ALL', data: { entities } });
            });
        }

        // Pseudo fallback
        const updated = entities.map(e => ({
            ...e,
            vector: pseudoEmbedText(`${e.name || ''} ${e.definition || ''}`.trim())
        }));
        return updated;
    }

    /**
     * Embeds a query string into a vector.
     * @param {string} query 
     * @returns {Promise<number[]>}
     */
    async embedQuery(query) {
        if (this.mode === 'onnx' && this.worker) {
            return new Promise((resolve, reject) => {
                this._pendingPromises.set('EMBED_QUERY', { resolve, reject });
                this.worker.postMessage({ type: 'EMBED_QUERY', data: { query } });
            });
        }

        return pseudoEmbedText(query);
    }

    /**
     * Ranks entities based on cosine similarity to the query string.
     * @param {string} query 
     * @param {Array<Object>} entities 
     * @param {Object} [options={}]
     * @param {number} [options.limit=4] 
     * @returns {Promise<Array<Object>>}
     */
    async rankMatches(query, entities, options = {}) {
        if (!query || !query.trim() || !Array.isArray(entities)) return [];
        const { limit = 4 } = options;

        const qVector = await this.embedQuery(query);
        const scored = entities.map(item => ({
            ...item,
            similarity: cosineSimilarity(qVector, item.vector)
        }));

        scored.sort((a, b) => b.similarity - a.similarity);
        return scored.slice(0, limit);
    }

    terminate() {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
        this.statusListeners.clear();
        this.progressListeners.clear();
        this.errorListeners.clear();
        this._pendingPromises.clear();
    }
}

/**
 * Factory helper
 */
export function createInferenceEngine(options = {}) {
    return new InferenceEngine(options);
}
