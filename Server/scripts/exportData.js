import fs from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = join(__dirname, '../data');
const CONVERSATIONS_FILE = join(DATA_DIR, 'conversations.json');

async function exportData() {
  try {
    const data = await fs.readFile(CONVERSATIONS_FILE, 'utf8');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const exportFile = join(DATA_DIR, `export-${timestamp}.json`);

    await fs.writeFile(exportFile, data);
    console.log(`Data exported to: ${exportFile}`);
  } catch (error) {
    console.error('Export failed:', error);
  }
}

exportData();