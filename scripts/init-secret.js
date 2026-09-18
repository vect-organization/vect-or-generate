import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const envPath = path.resolve(process.cwd(), '.env');

if (fs.existsSync(envPath)) {
  const currentEnv = fs.readFileSync(envPath, 'utf8');
  if (currentEnv.includes('VECTOR_APP_SECRET=')) {
    console.log('Already set.');
    process.exit(0);
  }
}

const secureRandomSecret = crypto.randomBytes(32).toString('hex');
const envContent = `\n# VectOrGenerate Core Secret (DO NOT SHARE)\nVECTOR_APP_SECRET="${secureRandomSecret}"\n`;
fs.appendFileSync(envPath, envContent, 'utf8');
console.log('New secure secret generated and set in .env!');
