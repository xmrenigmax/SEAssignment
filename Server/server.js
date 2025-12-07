/**
 * @file server.js
 * @description Main Express server for the Historical Figure Chatbot.
 * Acts as the backend API, managing conversation persistence (JSON),
 * CORS security, and interfacing with Hugging Face Inference APIs.
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { loadScript, checkScriptedResponse, getFallback } from './utils/logicEngine.js';

// CONFIGURATION
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Express setup
const app = express();
const PORT = process.env.PORT || 5000;

// Data Store Paths
const DATA_DIR = join(__dirname, 'data');
const CONVERSATIONS_FILE = join(DATA_DIR, 'conversations.json');
const SCRIPT_FILE = join(DATA_DIR, 'script.json');

// AI Configuration
const HF_ROUTER_URL = 'https://router.huggingface.co/v1/chat/completions';
const MODEL_ID = 'meta-llama/Llama-3.1-8B-Instruct';
const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;

// In-memory cache for conversations
let conversationCache = {};

/**
 * CORS Configuration.
 * explicitly allows requests from localhost:3000 and localhost:5173.
 */
const corsOptions = {
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    const allowedOrigins = [
      'http://localhost:3000', 'http://127.0.0.1:3000',
      'http://localhost:5173', 'http://127.0.0.1:5173'
    ];
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: [ 'GET', 'POST', 'PUT', 'DELETE', 'OPTIONS' ],
  allowedHeaders: [ 'Content-Type', 'Authorization' ]
};

app.use(cors(corsOptions));
app.use(express.json());

/**
 * Ensures the data directory exists.
 * Creates it recursively if missing.
 */
async function ensureDataDir() {
  try { await fs.access(DATA_DIR); } catch { await fs.mkdir(DATA_DIR, { recursive: true }); }
}

/**
 * Initializes the database on server start.
 * Loads existing conversations from JSON into memory.
 */
async function initializeDatabase() {
  await ensureDataDir();
  try {
    const data = await fs.readFile(CONVERSATIONS_FILE, 'utf8');
    conversationCache = JSON.parse(data);
    console.log(`Database loaded: ${ Object.keys(conversationCache).length } conversations.`);
  } catch (error) {
    console.log("No existing database found. Starting fresh.");
    conversationCache = {};
  }
}

/**
 * Persists the current in-memory cache to the JSON file.
 * Called after every write operation (Create/Update/Delete).
 */
async function syncToDisk() {
  try {
    await ensureDataDir();
    await fs.writeFile(CONVERSATIONS_FILE, JSON.stringify(conversationCache, null, 2));
  } catch (error) {
    console.error("Disk Sync Failed:", error.message);
  }
}

/**
 * Cleans the raw output from the LLM.
 * Removes system tokens, headers, and prefixes like "Marcus Aurelius:".
 * @param { string } text - The raw text from the AI.
 * @returns { string } The cleaned, user-facing text.
 */
function cleanAIResponse(text) {
  if (!text) return '';
  let cleaned = text;
  cleaned = cleaned.replace(/<\|start_header_id\|>.*?<\|end_header_id\|>/g, '');
  cleaned = cleaned.replace(/<\|eot_id\|>/g, '');
  cleaned = cleaned.replace(/^As (Marcus Aurelius|a Stoic|an Emperor).*?[,:]\s*/i, '');
  cleaned = cleaned.replace(/^(Marcus Aurelius|Marcus|The Emperor|Stoic|AI Response):/gmi, '');
  cleaned = cleaned.replace(/^["']|["']$/g, '').trim();
  return cleaned;
}

/**
 * Wrapper for fetch with a timeout.
 * Prevents the server from hanging indefinitely on AI requests.
 * @param { string } url - The URL to fetch.
 * @param { Object } options - Fetch options.
 * @param { number } timeout - Timeout in ms (default 40s).
 * @returns { Promise<Response> } The fetch response.
 */
async function fetchWithTimeout(url, options, timeout = 40000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally { clearTimeout(id); }
}

/**
 * Main AI Orchestrator.
 * 1. Checks for hardcoded script matches.
 * 2. Tries Llama 3.1 via Hugging Face.
 * 3. Falls back to SmolLM2 (Safety Net) on error.
 * 4. Falls back to generic quotes if all else fails.
 * @param { string } userMessage - The user's input text.
 * @returns { Promise<string> } The final response text.
 */

async function getMarcusResponse(userMessage) {
  const scriptedResponse = checkScriptedResponse(userMessage);
  if (scriptedResponse) return scriptedResponse;

  if (!HF_API_KEY || HF_API_KEY.includes('huggingface_api_key')) {
    console.log("No API Key - Using Scripted Fallback");
    return getFallback();
  }

  try {
    console.log(`Asking ${ MODEL_ID }...`);
    const response = await fetchWithTimeout(HF_ROUTER_URL, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${HF_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL_ID,
        messages: [
          {
            role: "system",
            content: "You are Marcus Aurelius. Speak only as him. Be brief, stoic, and wise. Do not use lists. avoid flowery language, firm and commanding but polite."
          },
          { role: "user", content: userMessage }
        ],
        max_tokens: 500,
        temperature: 0.7,
        stream: false
      }),
    }, 45000);

    if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", errorText);

        if (MODEL_ID.includes("Llama")) {
            console.log("Switching to Safety Net Model (SmolLM2)...");
            return await getSafetyNetResponse(userMessage);
        }
        return getFallback();
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || '';

    if (rawContent) {
        console.log("Raw AI:", rawContent.substring(0, 50) + "...");
        return cleanAIResponse(rawContent) || getFallback();
    }
    return getFallback();

  } catch (error) {
    console.error('AI Network Error:', error.message);
    return getFallback();
  }
}

/**
 * Safety Net AI Handler.
 * Uses a smaller, more reliable model (SmolLM2) if the primary Llama model fails/timeouts.
 * @param {string} userMessage
 * @returns {Promise<string>}
 */
async function getSafetyNetResponse(userMessage) {
    try {
        const response = await fetchWithTimeout(HF_ROUTER_URL, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${HF_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "HuggingFaceTB/SmolLM2-1.7B-Instruct",
                messages: [
                  {
                    role: "system",
                    content: "You are Marcus Aurelius. Be strict, clinical, and brief. No flowery language."
                  },
                  { role: "user", content: userMessage }
                ],
                max_tokens: 500,
                temperature: 0.6,
                stream: false
            }),
        }, 20000);
        const data = await response.json();
        return cleanAIResponse(data.choices?.[0]?.message?.content) || getFallback();
    } catch (e) {
        return getFallback();
    }
}

/**
 * Health Check.
 * GET /api/health
 */
app.get('/api/health', (req, res) => res.json({ status: 'OK', mode: 'Router + Llama 3.1' }));

/**
 * Get all conversations.
 * GET /api/conversations
 */
app.get('/api/conversations', (req, res) => res.json(conversationCache));

/**
 * Get specific conversation by ID.
 * GET /api/conversations/:conversationId
 */
app.get('/api/conversations/:conversationId', (req, res) => {
  const conversation = conversationCache[req.params.conversationId];
  if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
  res.json(conversation);
});

/**
 * Delete a specific conversation.
 * DELETE /api/conversations/:conversationId
 */
app.delete('/api/conversations/:conversationId', async (req, res) => {
  if (conversationCache[req.params.conversationId]) {
    delete conversationCache[req.params.conversationId];
    await syncToDisk();
  }
  res.json({ message: 'Deleted' });
});

/**
 * DELETE ALL Conversations.
 * DELETE /api/conversations
 * * Destructive Action: Wipes the entire database.
 */
app.delete('/api/conversations', async (req, res) => {
  conversationCache = {};
  await syncToDisk();
  console.log("All conversations wiped via API");
  res.json({ message: 'All conversations deleted' });
});

/**
 * Create a new conversation.
 * POST /api/conversations
 */
app.post('/api/conversations', async (req, res) => {
  const conversationId = uuidv4();
  const newConversation = {
    id: conversationId,
    title: 'New Council',
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  conversationCache[conversationId] = newConversation;
  await syncToDisk();
  res.status(201).json(newConversation);
});

/**
 * Send a message (Chat Loop).
 * POST /api/conversations/:conversationId/messages
 */
app.post('/api/conversations/:conversationId/messages', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Message required' });

    const conversation = conversationCache[conversationId];
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

    // Add User Message
    const userMessage = { id: uuidv4(), text, isUser: true, timestamp: new Date() };
    conversation.messages.push(userMessage);

    // Get AI Response
    const marcusResponse = await getMarcusResponse(text);
    const marcusMessage = { id: uuidv4(), text: marcusResponse, isUser: false, timestamp: new Date() };
    conversation.messages.push(marcusMessage);

    // Update & Sync
    conversation.updatedAt = new Date();
    await syncToDisk();

    res.json({ userMessage, marcusMessage, conversation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
});

// SERVER START
const server = app.listen(PORT, async () => {
  await initializeDatabase();
  await loadScript(SCRIPT_FILE);
  console.log(`\n Marcus Aurelius Server running on port ${ PORT }`);
});

// Set global timeout
server.timeout = 60000;