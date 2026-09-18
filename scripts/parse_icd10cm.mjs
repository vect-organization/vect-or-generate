import fs from 'fs';
import path from 'path';

const DATA_DIR = 'c:\\vect\\architecture\\data\\icd10cm-code-descriptions-2027\\icd10cm-codes-2027_split';
const OUT_FILE = 'c:\\vect\\vect-or-generate\\studio\\public\\icd10cm_2027_kb.json';

const files = [
  'icd10cm-codes-2027_part1_A-F.txt',
  'icd10cm-codes-2027_part2_G-M.txt',
  'icd10cm-codes-2027_part3_N-S.txt',
  'icd10cm-codes-2027_part4_T-Z.txt'
];

let entities = [];
let idCounter = 1;

for (const file of files) {
  const filePath = path.join(DATA_DIR, file);
  if (!fs.existsSync(filePath)) continue;

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    if (!line.trim()) continue;

    const match = line.match(/^(\S+)\s+(.+)$/);
    if (!match) continue;

    const code = match[1].trim();
    const description = match[2].trim();

    entities.push({
      id: `#${String(idCounter++).padStart(5, '0')}`,
      name: description,
      reading: description.toLowerCase(),
      definition: description,
      layer: 4,
      layerName: 'L4 Semantic',
      code: `ICD-10-CM: ${code}`,
      synonyms: [],
      inEditor: true,
      metadata: {
        source: 'CDC FY2027'
      },
      vector: []
    });
  }
}

fs.writeFileSync(OUT_FILE, JSON.stringify(entities, null, 2), 'utf-8');
console.log(`Generated JSON with ${entities.length} entities at ${OUT_FILE}`);
