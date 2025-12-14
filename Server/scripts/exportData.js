/**
 * @file scripts/exportData.js
 * @description Backs up your LIVE MongoDB Atlas database to a local timestamped JSON file.
 * Usage: node scripts/exportData.js
 */

import mongoose from 'mongoose';
import fs from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { Conversation } from '../models/Conversations.js';

dotenv.config();

// File paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, '../data');

async function exportData() {
  if (!process.env.MONGODB_URI) {
    console.error('Error: MONGODB_URI is missing from .env');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);

    console.log('Fetching live conversations...');
    // Lean() makes it faster by returning plain JS objects instead of Mongoose documents
    const conversations = await Conversation.find({}).lean();

    if (conversations.length === 0) {
      console.warn('Warning: Database is empty. Nothing to backup.');
    } else {

      // Create timestamp: YYYY-MM-DD_HH-MM-SS
      const now = new Date();
      const timestamp = now.toISOString().replace(/T/, '_').replace(/\..+/, '').replace(/:/g, '-');
      const exportFile = join(DATA_DIR, `backup-${ timestamp }.json`);

      // Ensure data directory exists
      try {
        await fs.access(DATA_DIR);
      } catch {
        await fs.mkdir(DATA_DIR, { recursive: true });
      }

      // Write to file
      await fs.writeFile(exportFile, JSON.stringify(conversations, null, 2));
      console.log(`Success: ${ conversations.length } conversations backed up to:\n   ${ exportFile }`);
    }

  } catch (error) {
    console.error('Export failed:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

exportData();