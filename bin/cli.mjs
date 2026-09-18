#!/usr/bin/env node
// Copyright (c) 2026 1abcdefggs
// SPDX-License-Identifier: MIT
// https://github.com/1abcdefggs/vect-or-generate

import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import fs from 'fs';
import { runDefaultJsonRecipe } from '../recipes/default_json_recipe.mjs';
import { runImportEncryptRecipe } from '../recipes/import_encrypt_recipe.mjs';

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
  node bin/cli.mjs --studio
  node bin/cli.mjs --import-encrypt <path> --password <pwd> --output <output_path>

Options:
  --domain <name>       Short domain identifier.
                        Reads from:  'inputs/<name>_data.json'
                        Outputs to:  'outputs/kb_<name>.json'
  --input <path>        Path to the raw items JSON file.
  --output <path>       Path to the output knowledge base JSON file.
  --model <model_id>    Hugging Face embedding model ID (default from config).
  --dry-run             Validate JSON schema without computing vector embeddings.
  --password <pwd>      Encrypt the output with a password (.venc).
  --import-encrypt      Read an existing JSON file, encrypt it, and output as .venc.
  --studio, -s          Launch Generator Studio Web GUI in browser.
  --help, -h            Show this help manual.

Examples:
  node bin/cli.mjs --domain legal
  node bin/cli.mjs --input inputs/medical.json --output outputs/kb_medical.json
  node bin/cli.mjs --studio
`);
}

function parseArgs() {
    const configPath = path.resolve(rootDir, 'config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    const args = process.argv.slice(2);
    const options = {
  password: null,
        domain: null,
        input: null,
        output: null,
        model: config.defaultModel,
        dryRun: false,
        launchStudio: false,
        importEncrypt: false
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '--help' || arg === '-h') {
          printUsage();
          process.exit(0);
        } else if (arg === '--password') {
          options.password = args[++i];
        } else if (arg === '--studio' || arg === '-s') {
            printUsage();
            process.exit(0);
        } else if (arg === '--studio' || arg === '-s') {
            options.launchStudio = true;
        } else if (arg === '--domain') {
            options.domain = args[++i];
        } else if (arg === '--import-encrypt') {
            options.importEncrypt = true;
            options.input = args[++i];
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

    if (options.launchStudio) {
        return options;
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
    console.error('\\x1b[31mError: You must specify either --domain <name> or both --input and --output.\\x1b[0m');
    printUsage();
    process.exit(1);
  }

  // Encryption mode handling
  if (options.password) {
    // Change output extension to .venc
    if (options.output) {
      options.output = options.output.replace(/\.json$/, '.venc');
    } else {
      options.output = path.join('outputs', 'kb_encrypted.venc');
    }
  }

    return options;
}

async function main() {
    const options = parseArgs();

    if (options.launchStudio) {
        console.log('============================================================');
        console.log('       Launching Generator Studio Web GUI...         ');
        console.log('============================================================');
        const studioDir = path.resolve(rootDir, 'studio');
        const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
        const child = spawn(npmCmd, ['run', 'dev'], { cwd: studioDir, stdio: 'inherit' });
        child.on('exit', (code) => process.exit(code || 0));
        return;
    }

    if (options.importEncrypt) {
        console.log('============================================================');
        console.log('       VectOrGenerate - Import & Encrypt Knowledge Base     ');
        console.log('============================================================');
        console.log(`Input:   ${options.input}`);
        console.log(`Output:  ${options.output}`);
        console.log('------------------------------------------------------------');

        try {
            const result = await runImportEncryptRecipe({
                inputPath: options.input,
                outputPath: options.output,
                password: options.password
            });
            console.log(`\x1b[32m[SUCCESS]\x1b[0m Encrypted knowledge base in ${result.elapsedSec.toFixed(2)}s.`);
            console.log(`Saved to: ${result.outputPath}`);
        } catch (e) {
            console.error(`\x1b[31m[ERROR]\x1b[0m Failed to import and encrypt: ${e.message}`);
            process.exit(1);
        }
        console.log('============================================================');
        return;
    }

    console.log('============================================================');
    console.log('       VectOrGenerate - 10-Layer Knowledge Builder          ');
    console.log('============================================================');
    console.log(`Input:   ${options.input}`);
    console.log(`Output:  ${options.output}`);
    console.log(`Domain:  ${options.domain || 'Auto-detect'}`);
    console.log(`Model:   ${options.model}`);
    console.log(`Mode:    ${options.dryRun ? 'DRY-RUN (Validation only)' : 'EMBEDDING COMPUTATION'}`);
    console.log('------------------------------------------------------------');

    const result = await runDefaultJsonRecipe({
        inputPath: options.input,
        outputPath: options.output,
        domain: options.domain,
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
        console.log(`\x1b[32m[PASS]\x1b[0m Validated ${result.count} items for domain '${result.domain}'. Schema is compliant.`);
    } else {
        console.log(`\x1b[32m[SUCCESS]\x1b[0m Generated ${result.count} vector items (Domain: ${result.domain}) in ${result.elapsedSec.toFixed(2)}s.`);
        console.log(`Saved to: ${result.outputPath}`);
    }
    console.log('============================================================');
}

main().catch(err => {
    console.error(`\n\x1b[31m[FATAL ERROR]\x1b[0m ${err.message}`);
    process.exit(1);
});

