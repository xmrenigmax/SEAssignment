/**
 * @file scripts/migrateToMongo.js
 * @description ONE-TIME SCRIPT to upload local JSON files to MongoDB Atlas.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Conversation, Script } from '../models/Conversations.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Paths to your CURRENT local files
const CONVERSATIONS_FILE = join(__dirname, '../data/conversations.json');
const SCRIPT_FILE = join(__dirname, '../data/script.json');

async function migrate() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is missing from .env');
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // MIGRATE CONVERSATIONS
    console.log('Reading local conversations...');
    try {
      const convoData = await fs.readFile(CONVERSATIONS_FILE, 'utf8');
      const conversationsObj = JSON.parse(convoData);
      const conversationList = Object.values(conversationsObj);

      if (conversationList.length > 0) {
        await Conversation.deleteMany({});
        await Conversation.insertMany(conversationList);
        console.log(`Uploaded ${conversationList.length } conversations to DB.`);
      }
    } catch (err) {
      console.warn(`Could not migrate conversations: ${err.message}`);
    }

    // MIGRATE SCRIPT
    console.log('Reading local script...');
    try {
      const scriptData = await fs.readFile(SCRIPT_FILE, 'utf8');
      const scriptJson = JSON.parse(scriptData);

      scriptJson.configId = 'main_config';

      await Script.deleteMany({});
      await Script.create(scriptJson);
      console.log(`Uploaded Logic Script to DB.`);
    } catch (err) {
      console.warn(`Could not migrate script: ${ err.message }`);
    }

    console.log('Migration Complete!');
    process.exit(0);

  } catch (error) {
    console.error('Migration Failed:', error);
    process.exit(1);
  }
}

migrate();