/**
 * Master Registry of Embedding Models & Dimension Specs
 * Defines dimension scales, provider specs, memory footprints, and execution contexts.
 */

export const EMBEDDING_MODELS_REGISTRY = [
  {
    id: "multilingual-e5-small",
    name: "Multilingual E5 Small",
    provider: "Microsoft / Hugging Face",
    dimensions: 384,
    multiplierVs384: 1.0,
    bytesPerVectorFp32: 1536, // 384 * 4 bytes
    maxTokens: 512,
    executionMode: "local_cpu_wasm",
    suitability: "Desktop / Offline / Sub-millisecond HNSW",
    description: "Current default for VectOrEdit. Ultra-lightweight, near-zero RAM footprint, optimized for local desktop text editing and sidebar dictionary matching."
  },
  {
    id: "all-minilm-l6-v2",
    name: "All MiniLM L6 v2",
    provider: "Sentence-Transformers",
    dimensions: 384,
    multiplierVs384: 1.0,
    bytesPerVectorFp32: 1536,
    maxTokens: 256,
    executionMode: "local_cpu_wasm",
    suitability: "English-focused Local Offline",
    description: "Standard English sentence embedding model with extreme speed and minimal compute overhead."
  },
  {
    id: "multilingual-e5-base",
    name: "Multilingual E5 Base",
    provider: "Microsoft / Hugging Face",
    dimensions: 768,
    multiplierVs384: 2.0,
    bytesPerVectorFp32: 3072,
    maxTokens: 512,
    executionMode: "local_desktop_gpu",
    suitability: "High-accuracy Desktop / Local Workstation",
    description: "Classic 768-dim BERT baseline architecture. Delivers superior semantic disambiguation for complex multilingual terminologies at 2x vector memory."
  },
  {
    id: "bge-base-en-v1.5",
    name: "BAAI General Embedding Base",
    provider: "BAAI",
    dimensions: 768,
    multiplierVs384: 2.0,
    bytesPerVectorFp32: 3072,
    maxTokens: 512,
    executionMode: "local_desktop_gpu",
    suitability: "Retrieval-Augmented Generation (RAG) standard",
    description: "Benchmark champion for open-source information retrieval and dense vector indexing."
  },
  {
    id: "multilingual-e5-large",
    name: "Multilingual E5 Large",
    provider: "Microsoft / Hugging Face",
    dimensions: 1024,
    multiplierVs384: 2.667,
    bytesPerVectorFp32: 4096,
    maxTokens: 512,
    executionMode: "local_gpu_server",
    suitability: "Studio Batch Compilation / Dedicated GPU",
    description: "Heavyweight 1024-dim embedding model. Ideal for batch pre-computing knowledge packages in Studio with high semantic resolution."
  },
  {
    id: "cohere-embed-multilingual-v3",
    name: "Cohere Embed Multilingual v3",
    provider: "Cohere",
    dimensions: 1024,
    multiplierVs384: 2.667,
    bytesPerVectorFp32: 4096,
    maxTokens: 512,
    executionMode: "cloud_api",
    suitability: "Enterprise Search & Retrieval",
    description: "State-of-the-art enterprise search API with built-in compression and search type intent tuning."
  },
  {
    id: "openai-text-embedding-3-small",
    name: "Text Embedding 3 Small",
    provider: "OpenAI",
    dimensions: 1536,
    multiplierVs384: 4.0,
    bytesPerVectorFp32: 6144,
    maxTokens: 8191,
    executionMode: "cloud_api",
    suitability: "Cloud RAG / Broad General Knowledge",
    description: "Standard commercial API format. Supports Matryoshka dimensionality reduction down to 512 or 256 dims."
  },
  {
    id: "openai-text-embedding-ada-002",
    name: "Text Embedding Ada 002",
    provider: "OpenAI",
    dimensions: 1536,
    multiplierVs384: 4.0,
    bytesPerVectorFp32: 6144,
    maxTokens: 8191,
    executionMode: "cloud_api",
    suitability: "Legacy Cloud RAG Standard",
    description: "Previous industry benchmark standard for cloud-based vector indexing."
  },
  {
    id: "openai-text-embedding-3-large",
    name: "Text Embedding 3 Large",
    provider: "OpenAI",
    dimensions: 3072,
    multiplierVs384: 8.0,
    bytesPerVectorFp32: 12288,
    maxTokens: 8191,
    executionMode: "cloud_api",
    suitability: "Ultra-high Precision Cloud Semantic Search",
    description: "High-end commercial embedding capable of capturing subtle legal, medical, and syntactic nuances."
  },
  {
    id: "google-text-embedding-004",
    name: "Gemini Text Embedding 004",
    provider: "Google Cloud",
    dimensions: 3072,
    multiplierVs384: 8.0,
    bytesPerVectorFp32: 12288,
    maxTokens: 2048,
    executionMode: "cloud_api",
    suitability: "Multimodal & Complex Semantic Grounding",
    description: "Google state-of-the-art text embedding with native MRL flexible output truncation."
  },
  {
    id: "llama-3-8b-hidden",
    name: "Llama 3 8B Hidden States",
    provider: "Meta",
    dimensions: 4096,
    multiplierVs384: 10.667,
    bytesPerVectorFp32: 16384,
    maxTokens: 8192,
    executionMode: "dedicated_server_vram",
    suitability: "On-Premise Private Enterprise AI",
    description: "Extracted direct representations from open weights LLMs. High-dimensional syntactic and factual awareness."
  },
  {
    id: "llama-3-70b-hidden",
    name: "Llama 3 70B / Frontier LLM",
    provider: "Meta / Frontier Models",
    dimensions: 8192,
    multiplierVs384: 21.333,
    bytesPerVectorFp32: 32768,
    maxTokens: 8192,
    executionMode: "multi_gpu_cluster",
    suitability: "Extensive Scientific / Statutory Global Ingestion",
    description: "Current empirical ceiling for dense vector spaces. Encodes long-context documents and complete statutory hierarchies."
  }
];

/**
 * Calculates vector memory footprint for a given vocabulary size
 * @param {number} dimensions
 * @param {number} entityCount
 * @returns {{ rawMb: number, formatted: string }}
 */
export function calculateVectorMemory(dimensions, entityCount) {
  const bytesPerVector = dimensions * 4; // Float32
  const totalBytes = bytesPerVector * entityCount;
  const rawMb = totalBytes / (1024 * 1024);
  return {
    rawMb: Number(rawMb.toFixed(2)),
    formatted: `${rawMb.toFixed(2)} MB`
  };
}
