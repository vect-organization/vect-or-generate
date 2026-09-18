import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const configPath = path.resolve(rootDir, 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

console.log(`Syncing config values: Version=${config.version}, Dimension=${config.dimension}`);

function updateJsonFile(filePath, updater) {
    if (!fs.existsSync(filePath)) return;
    try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        updater(data);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
        console.log(`\x1b[32m[OK]\x1b[0m Synced: ${path.relative(rootDir, filePath)}`);
    } catch (err) {
        console.error(`\x1b[31m[ERROR]\x1b[0m Failed to sync ${path.relative(rootDir, filePath)}:`, err.message);
    }
}

// 1. Update Root package.json
updateJsonFile(path.resolve(rootDir, 'package.json'), (data) => {
    data.version = config.version;
});

// 2. Update Studio package.json
updateJsonFile(path.resolve(rootDir, 'studio', 'package.json'), (data) => {
    data.version = config.version;
});

// 3. Update Knowledge Base Schema
updateJsonFile(path.resolve(rootDir, 'schemas', 'knowledge_base.schema.json'), (data) => {
    data.title = `VectOrg Knowledge Base Schema v${config.version} (kb_*.json)`;
    if (data.properties.version) data.properties.version.default = config.version;
    if (data.properties.dimension) {
        data.properties.dimension.default = config.dimension;
        data.properties.dimension.description = `Vector embedding dimensions (e.g. ${config.dimension} for E5-small).`;
    }
    const vectorProp = data.properties.entities?.items?.properties?.vector;
    if (vectorProp) {
        vectorProp.minItems = config.dimension;
        vectorProp.maxItems = config.dimension;
    }
});

// 4. Update Guideline Schema
updateJsonFile(path.resolve(rootDir, 'schemas', 'guideline.schema.json'), (data) => {
    data.title = `VectOrg Guideline & Linter Profile Schema v${config.version} (guideline_*.json)`;
    if (data.properties.version) data.properties.version.default = config.version;
});

// 5. Update Domain Data Template
updateJsonFile(path.resolve(rootDir, 'templates', 'domain_data.template.json'), (data) => {
    data.version = config.version;
    data.dimension = config.dimension;
});

// 6. Update Domain Profile Template
updateJsonFile(path.resolve(rootDir, 'templates', 'domain_profile.template.json'), (data) => {
    data.version = config.version;
});

console.log('Sync complete.');
