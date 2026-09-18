// Copyright (c) 2026 1abcdefggs
// SPDX-License-Identifier: MIT
// International Multilingual CSV & TSV Parser with Schema Normalization

/**
 * Multilingual Column Alias Matrix for universal cross-language CSV header detection.
 */
export const MULTILINGUAL_COLUMN_ALIASES = {
  name: ['name', 'term', 'keyword', 'lemma', 'concept', 'title', 'headword', '用語名', '単語', '見出し語', '用語', '词条', 'mot', 'begriff', 'término', 'termo'],
  reading: ['reading', 'pronunciation', 'kana', 'pinyin', 'ipa', 'furigana', '読み', 'ふりがな', 'フリガナ', '发音', 'lecture', 'aussprache', 'lectura', 'pronúncia'],
  definition: ['definition', 'meaning', 'description', 'desc', 'gloss', 'details', 'summary', '定義', '説明', '詳細', '意味', '释义', 'définition', 'definición', 'definição'],
  layer: ['layer', 'level', 'tier', 'hierarchy', 'layer_id', '階層', 'レイヤー', '层级', 'niveau', 'schicht', 'capa'],
  code: ['code', 'taxonomy', 'id_code', 'icd', 'icd10', 'category_code', '分類コード', 'コード', '分類', '编码', 'código'],
  synonyms: ['synonyms', 'synonym', 'aliases', 'alias', 'alternatives', '同義語', '類義語', '別名', '同义词', 'synonymes', 'synonyme', 'sinónimos']
};

/**
 * Maps raw header strings to standardized entity schema keys.
 * @param {string[]} headers 
 * @returns {Record<number, string>} Map of columnIndex -> standardKey
 */
export function mapMultilingualHeaders(headers) {
  const indexMap = {};

  headers.forEach((header, idx) => {
    const cleanHeader = header.trim().toLowerCase().replace(/['"_\s-]/g, '');

    for (const [standardKey, aliases] of Object.entries(MULTILINGUAL_COLUMN_ALIASES)) {
      const match = aliases.some(alias => cleanHeader === alias.toLowerCase().replace(/['"_\s-]/g, ''));
      if (match && !Object.values(indexMap).includes(standardKey)) {
        indexMap[idx] = standardKey;
        break;
      }
    }
  });

  return indexMap;
}

/**
 * Parses raw CSV/TSV text and returns standardized 10-layer entity array.
 * @param {string} text - Raw CSV / TSV text content
 * @param {string} [prefix='#'] - ID prefix
 * @returns {Array<Object>} Normalized entity collection
 */
export function parseAndNormalizeCsv(text, prefix = '#') {
  if (!text || typeof text !== 'string') return [];

  // Support both comma-separated and tab-separated formats
  const delimiter = text.includes('\t') ? '\t' : ',';
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);

  if (lines.length < 2) return [];

  // Parse header line
  const headerTokens = parseLineTokens(lines[0], delimiter);
  const colMap = mapMultilingualHeaders(headerTokens);

  const entities = [];

  for (let i = 1; i < lines.length; i++) {
    const tokens = parseLineTokens(lines[i], delimiter);
    if (tokens.length === 0 || tokens.every(t => t.trim() === '')) continue;

    const row = {};
    tokens.forEach((val, idx) => {
      const field = colMap[idx];
      if (field) {
        row[field] = val.trim();
      }
    });

    if (!row.name && tokens[0]) {
      row.name = tokens[0].trim();
    }

    if (row.name) {
      const parsedLayer = parseInt(row.layer, 10);
      const layer = !isNaN(parsedLayer) && parsedLayer >= 0 && parsedLayer <= 9 ? parsedLayer : 4;
      
      let synonyms = [];
      if (row.synonyms) {
        synonyms = row.synonyms
          .split(/[,;、|]/)
          .map(s => s.trim())
          .filter(Boolean);
      }

      entities.push({
        id: `${prefix}${String(entities.length + 1).padStart(2, '0')}`,
        name: row.name,
        reading: row.reading || row.name,
        definition: row.definition || '',
        layer,
        layerName: `L${layer} Semantic`,
        code: row.code || '',
        synonyms,
        inEditor: true,
        metadata: { source: null },
        vector: [] // Pending calculation
      });
    }
  }

  return entities;
}

/**
 * Splits a CSV line taking quotes into account.
 */
function parseLineTokens(line, delimiter) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim().replace(/^"(.*)"$/, '$1'));
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim().replace(/^"(.*)"$/, '$1'));
  return result;
}

/**
 * Parses raw JSON text (KB JSON or Entity array) and returns normalized entity array.
 * @param {string} text - Raw JSON string
 * @param {string} [prefix='#'] - ID prefix
 * @returns {Array<Object>} Normalized entity collection
 */
export function parseAndNormalizeJson(text, prefix = '#') {
  if (!text || typeof text !== 'string') return [];

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    throw new Error('Invalid JSON format: ' + err.message);
  }

  let rawList = [];
  if (Array.isArray(parsed)) {
    rawList = parsed;
  } else if (parsed && typeof parsed === 'object') {
    if (Array.isArray(parsed.entities)) {
      rawList = parsed.entities;
    } else if (Array.isArray(parsed.items)) {
      rawList = parsed.items;
    } else if (Array.isArray(parsed.data)) {
      rawList = parsed.data;
    } else {
      // Single entity object
      rawList = [parsed];
    }
  }

  return rawList.map((item, idx) => {
    const layer = typeof item.layer === 'number' && item.layer >= 0 && item.layer <= 9 ? item.layer : 4;
    return {
      id: item.id || `${prefix}${String(idx + 1).padStart(2, '0')}`,
      name: item.name || item.term || item.title || `Item #${idx + 1}`,
      reading: item.reading || item.pronunciation || item.name || '',
      definition: item.definition || item.meaning || item.desc || '',
      layer,
      layerName: item.layerName || `L${layer} Semantic`,
      code: item.code || item.taxonomy || '',
      synonyms: Array.isArray(item.synonyms) ? item.synonyms : [],
      inEditor: true,
      metadata: item.metadata || { source: null },
      vector: Array.isArray(item.vector) ? item.vector : []
    };
  });
}

/**
 * Parses raw XML text (ClaML or Generic XML) and returns normalized entity array.
 * @param {string} text - Raw XML string
 * @param {string} [prefix='#'] - ID prefix
 * @returns {Array<Object>} Normalized entity collection
 */
export function parseAndNormalizeXml(text, prefix = '#') {
  if (!text || typeof text !== 'string') return [];
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'text/xml');
  
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    throw new Error('Invalid XML: ' + parseError.textContent);
  }

  const entities = [];
  
  // Strategy 1: ClaML (ICD-10)
  const classes = doc.querySelectorAll('Class');
  if (classes.length > 0) {
    classes.forEach((cls) => {
      const code = cls.getAttribute('code') || '';
      
      let name = '';
      let definition = '';
      let synonyms = [];

      const rubrics = cls.querySelectorAll('Rubric');
      rubrics.forEach(rubric => {
        const kind = rubric.getAttribute('kind');
        const label = rubric.querySelector('Label')?.textContent || rubric.textContent || '';
        
        if (kind === 'preferred' && !name) {
          name = label.trim();
        } else if (kind === 'inclusion') {
          synonyms.push(label.trim());
        } else if (kind === 'text') {
          definition += (definition ? ' ' : '') + label.trim();
        }
      });

      if (!name) name = `Class ${code}`;

      entities.push({
        id: `${prefix}${String(entities.length + 1).padStart(4, '0')}`,
        name: name,
        reading: name,
        definition: definition,
        layer: 4,
        layerName: `L4 Semantic`,
        code: code,
        synonyms: synonyms.filter(Boolean),
        inEditor: true,
        metadata: { source: 'xml_claml' },
        vector: []
      });
    });
    return entities;
  }

  // Strategy 2: Generic XML (e.g., <diag><name>...</name></diag>)
  const root = doc.documentElement;
  const children = Array.from(root.children);
  if (children.length > 0) {
    children.forEach((child, idx) => {
      let name = child.querySelector('name, title, term, label')?.textContent || '';
      let code = child.querySelector('code, id, icd')?.textContent || '';
      let definition = child.querySelector('desc, description, definition, meaning')?.textContent || '';
      let reading = child.querySelector('reading, pronunciation')?.textContent || '';
      
      if (!name) name = child.getAttribute('name') || child.getAttribute('title') || `Item ${idx}`;

      entities.push({
        id: `${prefix}${String(entities.length + 1).padStart(4, '0')}`,
        name: name,
        reading: reading || name,
        definition: definition,
        layer: 4,
        layerName: `L4 Semantic`,
        code: code,
        synonyms: [],
        inEditor: true,
        metadata: { source: 'xml_generic' },
        vector: []
      });
    });
  }

  return entities;
}

/**
 * DEEP MODULE INTERFACE:
 * Automatically detects the file format (JSON, XML, CSV, TSV) from the text payload 
 * and routes it to the appropriate parser, hiding parsing complexity from callers.
 * 
 * @param {string} text - Raw file content
 * @param {string} [prefix='#'] - ID prefix
 * @returns {Array<Object>} Normalized entity collection
 */
export function parseAndNormalizeData(text, prefix = '#') {
  const trimmed = text.trim();
  if (trimmed.startsWith('<')) {
    return parseAndNormalizeXml(text, prefix);
  } else if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return parseAndNormalizeJson(text, prefix);
  } else {
    return parseAndNormalizeCsv(text, prefix);
  }
}
