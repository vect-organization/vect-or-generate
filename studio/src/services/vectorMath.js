/**
 * Vector and Cleansing Math Utilities for Generator Studio
 * High-performance vector math supporting standard Arrays and Float32Array
 */
import config from '../../../config.json' with { type: 'json' };
import { 
  stripProvenance as coreStripProvenance,
  shuffleIdentifiers as coreShuffleIdentifiers,
  injectSphericalNoise as coreInjectNoise
} from '../../../core/privacy/index.mjs';

/**
 * Computes cosine similarity between two normalized or unnormalized vectors.
 * If vectors are known to be L2-normalized (length=1.0), it computes pure dot product (3x faster).
 * @param {number[] | Float32Array} vecA 
 * @param {number[] | Float32Array} vecB 
 * @param {boolean} [assumeNormalized=true] - Set to false if vectors might not be normalized
 * @returns {number} Similarity score between 0.0 and 1.0
 */
export function cosineSimilarity(vecA, vecB, assumeNormalized = true) {
  if (!vecA || !vecB) return 0.0;
  const len = vecA.length;
  if (len === 0 || len !== vecB.length) return 0.0;

  let dot = 0.0;
  if (assumeNormalized) {
    for (let i = 0; i < len; i++) {
      dot += vecA[i] * vecB[i];
    }
    return Math.max(0, Math.min(1, (dot + 1) / 2 > 0.9999 ? 1.0 : dot));
  }

  let normA = 0.0;
  let normB = 0.0;
  for (let i = 0; i < len; i++) {
    const a = vecA[i];
    const b = vecB[i];
    dot += a * b;
    normA += a * a;
    normB += b * b;
  }
  if (normA <= 0 || normB <= 0) return 0.0;
  const sim = dot / (Math.sqrt(normA) * Math.sqrt(normB));
  return isNaN(sim) ? 0.0 : Math.max(0, Math.min(1, sim));
}

/**
 * Normalizes a vector in-place or returns a new normalized Float32Array.
 * @param {number[] | Float32Array} vec 
 * @returns {number[]} Normalized array
 */
export function normalizeVector(vec) {
  if (!vec || vec.length === 0) return [];
  const len = vec.length;
  let norm = 0.0;
  for (let i = 0; i < len; i++) {
    const v = vec[i];
    norm += v * v;
  }
  norm = Math.sqrt(norm);
  if (norm === 0) return new Array(len).fill(0);

  const result = new Array(len);
  for (let i = 0; i < len; i++) {
    result[i] = vec[i] / norm;
  }
  return result;
}

/**
 * Generates a high-quality deterministic L2-normalized float vector from text.
 * @param {string} text 
 * @returns {number[]} Normalized vector
 */
export function pseudoEmbedText(text) {
  const dim = config.dimension;
  if (!text) text = "empty";
  
  let seed = 0;
  for (let i = 0; i < text.length; i++) {
    seed = ((seed << 5) - seed + text.charCodeAt(i)) & 0xFFFFFFFF;
  }

  const raw = new Float32Array(dim);
  let norm = 0.0;
  for (let i = 0; i < dim; i++) {
    const x = Math.sin(seed + i * 997.33) * 43758.5453;
    const val = (x - Math.floor(x)) * 2.0 - 1.0;
    raw[i] = val;
    norm += val * val;
  }

  norm = Math.sqrt(norm) || 1.0;
  const result = new Array(dim);
  for (let i = 0; i < dim; i++) {
    result[i] = raw[i] / norm;
  }
  return result;
}


/**
 * Data Cleansing: Strips original URL, raw snippet, and source files.
 * @param {Array<Object>} entities 
 * @returns {Array<Object>}
 */
export function stripSourceProvenance(entities) {
  return coreStripProvenance(entities);
}

/**
 * Data Cleansing: Shuffles order of entities and generates anonymized sequential IDs.
 * @param {Array<Object>} entities 
 * @returns {Array<Object>}
 */
export function shuffleEntities(entities) {
  return coreShuffleIdentifiers(entities);
}

/**
 * Data Cleansing: Adds differential privacy noise to vector embeddings using Spherical Tangent Projection.
 * @param {number[] | Float32Array} vector 
 * @param {number} [epsilon=0.04] 
 * @returns {number[]}
 */
export function addDifferentialNoise(vector, epsilon = 0.04) {
  return coreInjectNoise(vector, { epsilon, mechanism: 'spherical_gaussian' });
}
