import { pipeline, env } from '@huggingface/transformers';
import config from '../../../config.json';

// Skip local check to allow browser caching via Hugging Face Hub / IndexedDB
env.allowLocalModels = false;
env.useBrowserCache = true;

let embedder = null;

async function getEmbedder(modelName = config.defaultModel) {
  if (embedder === null) {
    embedder = await pipeline('feature-extraction', modelName, {
      quantized: true,
      progress_callback: (info) => {
        if (info.status === 'progress' && info.total) {
          self.postMessage({
            type: 'MODEL_DOWNLOAD_PROGRESS',
            file: info.file,
            progress: info.loaded / info.total
          });
        }
      }
    });
  }
  return embedder;
}

self.onmessage = async (event) => {
  const { type, data } = event.data;

  try {
    if (type === 'LOAD_MODEL') {
      self.postMessage({ type: 'STATUS', status: 'loading' });
      await getEmbedder(data?.modelName);
      self.postMessage({ type: 'STATUS', status: 'ready' });
    } 
    else if (type === 'EMBED_ALL') {
      const { entities } = data;
      self.postMessage({ type: 'STATUS', status: 'embedding_entities' });
      const generator = await getEmbedder(data?.modelName);
      
      const textsToEmbed = entities.map(e => `passage: ${(e.name || '')} ${(e.definition || '')}`.trim());
      
      // Batch inference in chunks of 8 to maintain UI responsiveness and peak WASM SIMD acceleration
      const chunkSize = 8;
      const updatedEntities = [];
      const dim = config.dimension;

      for (let i = 0; i < entities.length; i += chunkSize) {
        const chunkEntities = entities.slice(i, i + chunkSize);
        const chunkTexts = textsToEmbed.slice(i, i + chunkSize);

        const output = await generator(chunkTexts, { pooling: 'mean', normalize: true });
        const rawData = output.data;

        for (let j = 0; j < chunkEntities.length; j++) {
          const offset = j * dim;
          const vector = Array.from(rawData.subarray(offset, offset + dim));
          updatedEntities.push({
            ...chunkEntities[j],
            vector
          });
        }

        const processed = Math.min(i + chunkSize, entities.length);
        self.postMessage({ type: 'PROGRESS', progress: processed / entities.length });
      }

      self.postMessage({ type: 'EMBED_ALL_DONE', entities: updatedEntities });
    }
    else if (type === 'EMBED_QUERY') {
      const { query } = data;
      const generator = await getEmbedder(data?.modelName);
      const textToEmbed = `query: ${(query || '').trim()}`;
      const output = await generator(textToEmbed, { pooling: 'mean', normalize: true });
      self.postMessage({ type: 'EMBED_QUERY_DONE', queryVector: Array.from(output.data) });
    }
  } catch (error) {
    self.postMessage({ type: 'ERROR', error: error.message });
  }
};
