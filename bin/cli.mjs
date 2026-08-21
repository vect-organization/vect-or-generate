#!/usr/bin/env node
// Copyright (c) 2026 1abcdefggs
// SPDX-License-Identifier: MIT
// https://github.com/1abcdefggs/vect-or-generate

import path from 'path';
import { fileURLToPath } from 'url';
import { runDefaultJsonRecipe } from '../recipes/default_json_recipe.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function printUsage() {
    console.log(`
============================================================
       VectOrGenerate - 10-Layer Semantic Knowledge Builder  
============================================================

Usage:
  node bin/cli.mjs --input <input_json> --output <output_kb_json>
  node bin/cli.mjs --domain <name> [options]

Options:
  --domain <name>       Short domain identifier.
                        Reads from:  'inputs/<name>_data.json'
                        Outputs to:  'outputs/kb_<name>.json'
  --input <path>        Path to the raw items JSON file.
  --output <path>       Path to the output knowledge base JSON file.
  --model <model_id>    Hugging Face embedding model ID (default: 'Xenova/multilingual-e5-small').
  --dry-run             Validate JSON schema without computing vector embeddings.
  --help, -h            Show this help manual.

Examples:
  node bin/cli.mjs --domain legal
  node bin/cli.mjs --input inputs/medical.json --output outputs/kb_medical.json
`);
}

function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        domain: null,
        input: null,
        output: null,
        model: 'Xenova/multilingual-e5-small',
        dryRun: false
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '--help' || arg === '-h') {
            printUsage();
            process.exit(0);
        } else if (arg === '--domain') {
            options.domain = args[++i];
        } else if (arg === '--input') {
            options.input = args[++i];
        } else if (arg === '--output') {
            options.output = args[++i];
        } else if (arg === '--model') {
            options.model = args[++i];
        } else if (arg === '--dry-run') {
            options.dryRun = true;
        }
    }

    if (options.domain) {
        if (!options.input) {
            options.input = path.resolve(rootDir, 'inputs', `${options.domain}_data.json`);
        }
        if (!options.output) {
            options.output = path.resolve(rootDir, 'outputs', `kb_${options.domain}.json`);
        }
    }

    if (!options.input || !options.output) {
        console.error('\x1b[31mError: You must specify either --domain <name> or both --input and --output.\x1b[0m');
        printUsage();
        process.exit(1);
    }

    return options;
}

async function main() {
    const options = parseArgs();

    console.log('============================================================');
    console.log('       VectOrGenerate - 10-Layer Knowledge Builder          ');
    console.log('============================================================');
    console.log(`Input:   ${options.input}`);
    console.log(`Output:  ${options.output}`);
    console.log(`Model:   ${options.model}`);
    console.log(`Mode:    ${options.dryRun ? 'DRY-RUN (Validation only)' : 'EMBEDDING COMPUTATION'}`);
    console.log('------------------------------------------------------------');

    const result = await runDefaultJsonRecipe({
        inputPath: options.input,
        outputPath: options.output,
        modelName: options.model,
        dryRun: options.dryRun,
        onProgress: (current, total, item) => {
            if (current % 10 === 0 || current === total) {
                const pct = Math.round((current / total) * 100);
                console.log(`[${current}/${total}] (${pct}%) Embedded: ${item.name || item.id || `Item #${current}`}`);
            }
        }
    });

    console.log('------------------------------------------------------------');
    if (options.dryRun) {
        console.log(`\x1b[32m[PASS]\x1b[0m Validated ${result.count} items. Schema is compliant.`);
    } else {
        console.log(`\x1b[32m[SUCCESS]\x1b[0m Generated ${result.count} vector items in ${result.elapsedSec.toFixed(2)}s.`);
        console.log(`Saved to: ${result.outputPath}`);
    }
    console.log('============================================================');
}

main().catch(err => {
    console.error(`\n\x1b[31m[FATAL ERROR]\x1b[0m ${err.message}`);
    process.exit(1);
});
