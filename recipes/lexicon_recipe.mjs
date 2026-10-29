// Copyright (c) 2026 1abcdefggs
// SPDX-License-Identifier: MIT
// Transform Recipe: any record list (a lexicon, a glossary, a statute's articles) + a mapping file
// -> the 5-artifact bundle (kb / safetensors / guideline / ime / audit), optionally encrypted (.venc).
//
// Usage: node recipes/lexicon_recipe.mjs --mapping=<mapping.json> [--input=<records.json>] [--out-dir=<dir>]
//        [--password=<pwd>] [--dry-run]
//
// The recipe knows no source. The mapping file names the source's fields, so the same code serves
// any language or domain. Mapping keys (paths in the mapping are relative to the mapping file):
//   domain, taxonomyCode, input (overridden by --input), recordsPath (dot path to the record array, empty = top level),
//   fields      { id, name, reading, definition, synonyms, code, category } -> source field names
//   layer       legacy layer number for every record (default 4)
//   vectorText  entity fields joined into the embedded passage (default: name, synonyms, definition)
//   metadata    { outputKey: sourceField } copied into each entity's metadata
//   renameKeys  { sourceKey: outputKey } applied to keys inside metadata values (nested objects)
//   ruleSources [{ dir, file?, rules: { ruleId: { severity, category, minLength? } } }]
//               -> term rules taken from criteria files whose generalRules[] carry badExamples[]

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { compileData } from '../core/compiler/pipeline.mjs';
import { packageArtifactBundle, exportArtifactsToDisk } from '../core/packager/index.mjs';
import { encryptKnowledgeBase } from '../core/vault/index.js';

const getPath = (obj, dotPath) => (dotPath ? dotPath.split('.').reduce((o, k) => (o == null ? o : o[k]), obj) : obj);
const isBlank = (v) => v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)
    || (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0);

function renameDeep(value, renameKeys) {
    if (Array.isArray(value)) return value.map((v) => renameDeep(v, renameKeys));
    if (value && typeof value === 'object') {
        const out = {};
        for (const [k, v] of Object.entries(value)) out[renameKeys[k] || k] = renameDeep(v, renameKeys);
        return out;
    }
    return value;
}

/** Maps source records to 10-layer entities (no vectors yet). */
export function mapRecords(records, mapping) {
    const f = mapping.fields || {};
    const renameKeys = mapping.renameKeys || {};
    const vectorText = mapping.vectorText || ['name', 'synonyms', 'definition'];
    return records.map((rec, idx) => {
        const synonyms = [].concat(rec[f.synonyms] || []).filter(Boolean).map(String);
        const entity = {
            id: String(rec[f.id] ?? `#${String(idx + 1).padStart(4, '0')}`),
            name: String(rec[f.name] ?? ''),
            reading: String(rec[f.reading] ?? ''),
            definition: String(rec[f.definition] ?? ''),
            synonyms,
            code: String(rec[f.code] ?? ''),
            category: String(rec[f.category] || 'General'),
            layer: mapping.layer ?? 4,
            metadata: {}
        };
        for (const [outKey, srcKey] of Object.entries(mapping.metadata || {})) {
            const v = rec[srcKey];
            if (!isBlank(v)) entity.metadata[outKey] = renameDeep(v, renameKeys);
        }
        entity.text_for_vector = vectorText
            .map((k) => (Array.isArray(entity[k]) ? entity[k].join(' ') : entity[k] ?? entity.metadata[k] ?? ''))
            .filter(Boolean).join(' / ');
        return entity;
    });
}

/** Term rules (pattern / message / severity) from criteria files: generalRules[].badExamples[]. */
export function extractTermRules(ruleSources, baseDir) {
    const rules = [];
    const seen = new Set();
    for (const src of ruleSources || []) {
        const dir = path.resolve(baseDir, src.dir || '.');
        const files = src.file ? [src.file] : fs.readdirSync(dir).filter((n) => n.endsWith('.json')).sort();
        files.forEach((file, fileIdx) => {
            const doc = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
            for (const g of doc.generalRules || []) {
                const conf = src.rules?.[g.id];
                if (!conf) continue;
                const allowed = (g.allowedTerms || []).join('\n');
                (g.badExamples || []).forEach((pattern, n) => {
                    if (typeof pattern !== 'string' || pattern.length < (conf.minLength || 1)) return;
                    if (allowed.includes(pattern)) return; // would also fire inside an allowed term
                    if (seen.has(pattern)) return;
                    seen.add(pattern);
                    rules.push({
                        id: `TERM-${fileIdx + 1}-${g.id}-${n + 1}`,
                        type: 'term_rule',
                        category: conf.category || g.id,
                        severity: conf.severity || 'warning',
                        facet: conf.severity === 'error' ? 'G.rule' : 'G.policy',
                        pattern,
                        message: `${g.description}${doc.documentType ? ` [${doc.documentType}]` : ''}`
                    });
                });
            }
        });
    }
    return rules;
}

export async function runLexiconRecipe({ mappingPath, inputPath, outDir, password = null, dryRun = false, onProgress = null }) {
    const mappingDir = path.dirname(path.resolve(mappingPath));
    const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
    // --input is relative to the working directory; `input` in the mapping is relative to the mapping file
    const input = inputPath ? path.resolve(inputPath) : path.resolve(mappingDir, mapping.input || '');
    const records = getPath(JSON.parse(fs.readFileSync(input, 'utf8')), mapping.recordsPath || '');
    if (!Array.isArray(records) || records.length === 0) throw new Error(`no records at "${mapping.recordsPath || '(top level)'}" in ${input}`);
    const domain = mapping.domain || path.basename(input, path.extname(input));

    const entities = mapRecords(records, mapping);
    const compiled = await compileData(entities, { domain, dryRun, onProgress });
    const extraRules = extractTermRules(mapping.ruleSources, path.dirname(input));
    const bundle = await packageArtifactBundle({
        entities: compiled.entities, domain, taxonomyCode: mapping.taxonomyCode || 'Standard', extraRules, dryRun
    });

    const dir = path.resolve(outDir || path.join('outputs', domain));
    const written = await exportArtifactsToDisk(bundle, dir);
    if (password) {
        // The encrypted KB replaces the plain one; the other artifacts carry no entry text beyond terms
        const kbName = `kb_${domain}.json`;
        const venc = await encryptKnowledgeBase(bundle.files[kbName], password);
        fs.writeFileSync(path.join(dir, `kb_${domain}.venc`), venc);
        fs.rmSync(path.join(dir, kbName));
    }
    return { domain, dir, itemCount: bundle.itemCount, ruleCount: bundle.files[`guideline_${domain}.json`].totalRules, written, encrypted: Boolean(password) };
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
    const flags = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--'))
        .map((a) => { const [k, ...v] = a.slice(2).split('='); return [k, v.length ? v.join('=') : true]; }));
    if (!flags.mapping) {
        console.error('Usage: node recipes/lexicon_recipe.mjs --mapping=<mapping.json> [--input=<records.json>] [--out-dir=<dir>] [--password=<pwd>] [--dry-run]');
        process.exit(1);
    }
    const t0 = Date.now();
    const r = await runLexiconRecipe({
        mappingPath: flags.mapping, inputPath: flags.input, outDir: flags['out-dir'],
        password: flags.password || null, dryRun: Boolean(flags['dry-run']),
        onProgress: (i, n) => { if (i % 200 === 0 || i === n) console.log(`[${i}/${n}] mapped`); }
    });
    console.log(`domain ${r.domain}: ${r.itemCount} items, ${r.ruleCount} rules${r.encrypted ? ', KB encrypted' : ''} -> ${r.dir} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
}
