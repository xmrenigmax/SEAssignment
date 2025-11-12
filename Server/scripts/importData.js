import fs from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = join(__dirname, '../data');
const CONVERSATIONS_FILE = join(DATA_DIR, 'conversations.json');

async function importData(importFile) {
  try {
    const data = await fs.readFile(importFile, 'utf8');
    await fs.writeFile(CONVERSATIONS_FILE, data);
    console.log(`Data imported from: ${importFile}`);
  } catch (error) {
    console.error('Import failed:', error);
  }
}

// Usage: node scripts/importData.js path/to/import.json
const importFile = process.argv[2];
if (importFile) {
  importData(importFile);
} else {
  console.log('Please provide import file path');
}