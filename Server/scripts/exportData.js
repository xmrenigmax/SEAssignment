/**
 * @file exportData.js
 * @description Backs up your conversation database to a timestamped JSON file.
 * Usage: node scripts/exportData.js
 */

import fs from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// File paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, '../data');
const CONVERSATIONS_FILE = join(DATA_DIR, 'conversations.json');

async function exportData() {
  try {
    // Check if DB exists
    await fs.access(CONVERSATIONS_FILE);

    const data = await fs.readFile(CONVERSATIONS_FILE, 'utf8');

    // Create timestamp: YYYY-MM-DD_HH-MM-SS
    const now = new Date();
    const timestamp = now.toISOString().replace(/T/, '_').replace(/\..+/, '').replace(/:/g, '-');

    const exportFile = join(DATA_DIR, `backup-${ timestamp }.json`);

    await fs.writeFile(exportFile, data);
    console.log(`Success: Database backed up to: \n   ${ exportFile }`);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error(`Error: No database found at ${ CONVERSATIONS_FILE }`);
    } else {
      console.error('Export failed:', error.message);
    }
  }
}

exportData();