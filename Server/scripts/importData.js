/**
 * @file scripts/importData.js
 * @description Restores your MongoDB database from a local JSON backup file.
 */

import mongoose from 'mongoose';
import fs from 'fs/promises';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Import the Model
import { Conversation } from '../models/Conversations.js';

dotenv.config();

// Determine current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function importData(relativePath) {
  // Resolve full path
  const importFilePath = resolve(process.cwd(), relativePath);

  if (!process.env.MONGODB_URI) {
    console.error('Error: MONGODB_URI is missing from .env');
    process.exit(1);
  }

  try {
    // Read the backup file
    console.log(`Reading backup file: ${ importFilePath }...`);
    const fileContent = await fs.readFile(importFilePath, 'utf8');
    const jsonData = JSON.parse(fileContent);

    // Connect to MongoDB
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);

    // Data Preparation
    let conversationsToInsert = [];

    if (Array.isArray(jsonData)) {
      conversationsToInsert = jsonData;
    } else {

      // It's likely the old object map format
      conversationsToInsert = Object.values(jsonData);
    }

    if (conversationsToInsert.length === 0) {
      console.warn('No conversations found in this backup file.');
      process.exit(0);
    }

    // We delete existing data to avoid duplicate key errors on 'id'
    console.log('Clearing existing database collection...');
    await Conversation.deleteMany({});

    console.log(`Importing ${ conversationsToInsert.length } conversations...`);
    await Conversation.insertMany(conversationsToInsert);

    console.log(`Success: Database restored from ${ relativePath }`);

  } catch (error) {
    console.error(`Import Failed: ${ error.message }`);
  } finally {
    // Close connection
    await mongoose.connection.close();
    process.exit(0);
  }
}

// Get file path from command line argument
const importFile = process.argv[2];

if (importFile) {
  importData(importFile);
} else {
  console.log('Usage Error. Please provide a file path.');
  console.log('Example: node scripts/importData.js data/backup-2025-12-14.json');
}