/**
 * @file importData.js
 * @description Restores your database from a backup file.
 * Usage: node scripts/importData.js data/backup-2025-12-07...json
 */

import fs from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// File paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, '../data');
const CONVERSATIONS_FILE = join(DATA_DIR, 'conversations.json');

async function importData(importFilePath) {
  try {
    // Read the backup file
    const data = await fs.readFile(importFilePath, 'utf8');

    // Validate it's actual JSON before overwriting
    JSON.parse(data);

    // Overwrite
    await fs.writeFile(CONVERSATIONS_FILE, data);
    console.log(`Success: Database restored from ${ importFilePath }`);
    console.log(`   (Server restart recommended to load new data)`);
  } catch (error) {
    console.error(`Import Failed: ${ error.message }`);
  }
}

// Get file path from command line argument
const importFile = process.argv[2];

if (importFile) {
  importData(importFile);
} else {
  console.log(' Usage Error. Please provide a file path.');
  console.log(' Example: node scripts/importData.js data/backup-filename.json');
}