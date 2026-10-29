// Copyright (c) 2026 1abcdefggs
// SPDX-License-Identifier: MIT
// Transform Recipe: CDC ICD-10-CM code-description TSV -> schema v2 (concepts[])
//
// Usage: node recipes/icd10cm_v2_recipe.mjs <codes.txt> [more.txt ...] --out=<file> [--release=FY2027] [--limit=N]
//
// The CDC "codes" file lists billable leaf codes only, so category / subcategory parents
// (A00, A010, ...) are absent. Pointing `broader` at them would leave every hierarchy edge
// dangling (verified: 4874/4874 in the A-F split). This recipe therefore synthesizes the
// missing ancestors as stub concepts (`stub: true`, hidden label = code) so the hierarchy is
// closed under `broader`. Real titles for those stubs come from the CDC "order" file
// (icd10cm_order_<year>.txt, which includes non-billable headers); pass it with --order=.

import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const SCHEME = 'ICD-10-CM';

function parseCodesFile(text) {
    const rows = [];
    for (const line of text.split(/\r?\n/)) {
        const m = line.match(/^(\S+)\s+(.+)$/);
        if (m) rows.push({ code: m[1].trim(), title: m[2].trim(), billable: true });
    }
    return rows;
}

// CDC order file: fixed width — order(5) sp code(7) sp billable(1) sp short(60) sp long
function parseOrderFile(text) {
    const map = new Map();
    for (const line of text.split(/\r?\n/)) {
        if (line.length < 16) continue;
        const code = line.slice(6, 13).trim();
        const billable = line.slice(14, 15) === '1';
        const longTitle = line.slice(77).trim() || line.slice(16, 76).trim();
        if (code) map.set(code, { title: longTitle, billable });
    }
    return map;
}

export function buildIcd10cmV2({ rows, release, orderMap = null, limit = null }) {
    const used = limit ? rows.slice(0, limit) : rows;
    const byCode = new Map(used.map(r => [r.code, r]));

    // close the hierarchy: add every missing ancestor
    const stubs = new Map();
    for (const r of used) {
        for (let p = r.code.slice(0, -1); p.length >= 3; p = p.slice(0, -1)) {
            if (!byCode.has(p) && !stubs.has(p)) stubs.set(p, orderMap?.get(p) || null);
        }
    }

    const concept = (code, title, billable, stub) => {
        const parent = code.length > 3 ? code.slice(0, -1) : null;
        return {
            id: `c:icd10cm:${code}`,
            notations: [{ scheme: SCHEME, value: code, version: release }],
            broader: parent ? [`c:icd10cm:${parent}`] : null,
            depth: code.length - 3,
            labels: title
                ? [{ kind: 'pref', lang: 'en', text: title, provenance: { source: `CDC ${SCHEME} ${release}` } }]
                : [{ kind: 'hidden', lang: 'en', text: code }],
            ...(title ? { senses: [{ id: `s:icd10cm:${code}:1`, definition: title }] } : {}),
            facet: 'F.concept',
            ...(stub ? { stub: true } : {}),
            legacy: { billable },
        };
    };

    const concepts = [
        ...used.map(r => concept(r.code, r.title, true, false)),
        ...[...stubs].map(([code, o]) => concept(code, o?.title || null, o?.billable ?? false, !o)),
    ].sort((a, b) => a.notations[0].value.localeCompare(b.notations[0].value));

    return {
        domain: 'icd10cm',
        schemaVersion: '2.0',
        source: {
            provenance: `CDC ${SCHEME} ${release} code descriptions`,
            license: 'public-domain (US Government work)',
            sample: Boolean(limit),
            sampleCount: concepts.length,
            note: `${used.length} billable codes + ${stubs.size} synthesized ancestors` +
                  (orderMap ? ' (titled from order file)' : ' (stub titles: supply --order=icd10cm_order file)'),
        },
        concepts,
    };
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
    const args = process.argv.slice(2);
    const flags = Object.fromEntries(args.filter(a => a.startsWith('--')).map(a => a.slice(2).split('=')));
    const inputs = args.filter(a => !a.startsWith('--'));
    if (!inputs.length || !flags.out) {
        console.error('Usage: node recipes/icd10cm_v2_recipe.mjs <codes.txt>... --out=<file> [--release=FY2027] [--order=<order.txt>] [--limit=N]');
        process.exit(1);
    }
    const rows = inputs.flatMap(p => parseCodesFile(readFileSync(p, 'utf-8')));
    const orderMap = flags.order ? parseOrderFile(readFileSync(flags.order, 'utf-8')) : null;
    const doc = buildIcd10cmV2({ rows, release: flags.release || 'FY2027', orderMap, limit: flags.limit ? Number(flags.limit) : null });
    writeFileSync(flags.out, JSON.stringify(doc, null, 2), 'utf-8');
    console.log(`wrote ${doc.concepts.length} concepts -> ${flags.out} (${doc.source.note})`);
}
