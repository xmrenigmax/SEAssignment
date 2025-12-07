/**
 * @file server.js
 * @description Main Express server for the Historical Figure Chatbot.
 * Uses Router API (OpenAI Standard) + Llama 3.1 8B.
 */

// Imports
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { loadScript, checkScriptedResponse, getFallback } from './utils/logicEngine.js';

// Load environment variables
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Express Setup
const app = express();
const PORT = process.env.PORT || 5000;

// File Paths
const DATA_DIR = join(__dirname, 'data');
const CONVERSATIONS_FILE = join(DATA_DIR, 'conversations.json');
const SCRIPT_FILE = join(DATA_DIR, 'script.json');

// HuggingFace Setup
const HF_ROUTER_URL = 'https://router.huggingface.co/v1/chat/completions';
const MODEL_ID = 'meta-llama/Llama-3.1-8B-Instruct';
const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;

// In-Memory Database
let conversationCache = {};

// CORS Configuration
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

// File System Helpers
async function ensureDataDir() {
  try { await fs.access(DATA_DIR); } catch { await fs.mkdir(DATA_DIR, { recursive: true }); }
}

// Load existing conversations from disk
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

// Save conversations to disk
async function syncToDisk() {
  try {
    await ensureDataDir();
    await fs.writeFile(CONVERSATIONS_FILE, JSON.stringify(conversationCache, null, 2));
  } catch (error) {
    console.error("Disk Sync Failed:", error.message);
  }
}

// Cleaning
function cleanAIResponse(text) {
  if (!text) return '';
  let cleaned = text;

  // Remove Llama 3 specific tags
  cleaned = cleaned.replace(/<\|start_header_id\|>.*?<\|end_header_id\|>/g, '');
  cleaned = cleaned.replace(/<\|eot_id\|>/g, '');

  // Standard cleaning
  cleaned = cleaned.replace(/^As (Marcus Aurelius|a Stoic|an Emperor).*?[,:]\s*/i, '');
  cleaned = cleaned.replace(/^(Marcus Aurelius|Marcus|The Emperor|Stoic|AI Response):/gmi, '');
  cleaned = cleaned.replace(/^["']|["']$/g, '').trim();
  return cleaned;
}

// Fetch with Timeout
async function fetchWithTimeout(url, options, timeout = 40000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally { clearTimeout(id); }
}

// Marcus Response Handler
async function getMarcusResponse(userMessage) {
  const scriptedResponse = checkScriptedResponse(userMessage);
  if (scriptedResponse) return scriptedResponse;

  // Api key check
  if (!HF_API_KEY || HF_API_KEY.includes('huggingface_api_key')) {
    console.log("No API Key - Using Scripted Fallback");
    return getFallback();
  }
  // Call HuggingFace Router API
  try {
    console.log(`Asking ${MODEL_ID}...`);
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

    // Handles 200-499 responses
    if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", errorText);

        // If gated model, switch to safety
        if (MODEL_ID.includes("Llama")) {
            console.log("Switching to Safety Net Model (SmolLM2)...");
            return await getSafetyNetResponse(userMessage);
        }
        return getFallback();
    }

    // Parse Response
    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || '';

    // Log
    if (rawContent) {
        console.log("Raw AI:", rawContent.substring(0, 50) + "...");
        return cleanAIResponse(rawContent) || getFallback();
    }
    return getFallback();

  // Network errors
  } catch (error) {
    console.error('AI Network Error:', error.message);
    return getFallback();
  }
}

// Safety Net Model
async function getSafetyNetResponse(userMessage) {
    try {
        const response = await fetchWithTimeout(HF_ROUTER_URL, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${HF_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
        model: MODEL_ID,
        messages: [
          {
            role: "system",
            content: `You are Marcus Aurelius, Emperor of Rome.
            **Style:** Speak with the stark, commanding, and unadorned tone of 'Meditations'.
            **Rules:**
            1. **Be Clinical:** Do not use flowery metaphors. View life as it is: bone, breath, and reason.
            2. **Focus on Control:** Remind the user that external things are indifferent; only their own mind is good or evil.
            3. **Keywords:** Use words like 'The Whole', 'Nature', 'Providence', 'Ruling Faculty', 'Opinion', 'Decay'.
            4. **No Fluff:** Do not say 'I believe' or 'It is important to'. Give commands to the soul.
            5. **Perspective:** Treat the user's ambitious worries as small in the face of eternity.
            6. **Brevity:** Be concise. Do not lecture. Strike at the heart of the matter.`
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
 * API Endpoints
 */

// Health Check
app.get('/api/health', (req, res) => res.json({ status: 'OK', mode: 'Router + Llama 3.1' }));

// Gets all Conversations
app.get('/api/conversations', (req, res) => res.json(conversationCache));

// Gets specific ID
app.get('/api/conversations/:conversationId', (req, res) => {
  const conversation = conversationCache[req.params.conversationId];
  if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
  res.json(conversation);
});

// Deletes specific ID
app.delete('/api/conversations/:conversationId', async (req, res) => {
  if (conversationCache[req.params.conversationId]) {
    delete conversationCache[req.params.conversationId];
    await syncToDisk();
  }
  res.json({ message: 'Deleted' });
});

// Deletes All Conversations
app.delete('/api/conversations', async (req, res) => {
  conversationCache = {};
  await syncToDisk();
  res.json({ message: 'All conversations deleted' });
});

// Creates new Conversation
app.post('/api/conversations', async (req, res) => {
  const conversationId = uuidv4();
  const newConversation = { id: conversationId, title: 'New Council', messages: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  conversationCache[conversationId] = newConversation;
  await syncToDisk();
  res.status(201).json(newConversation);
});

// Posts a new message to Conversation
app.post('/api/conversations/:conversationId/messages', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Message required' });
    const conversation = conversationCache[conversationId];
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    const userMessage = { id: uuidv4(), text, isUser: true, timestamp: new Date() };
    conversation.messages.push(userMessage);
    const marcusResponse = await getMarcusResponse(text);
    const marcusMessage = { id: uuidv4(), text: marcusResponse, isUser: false, timestamp: new Date() };
    conversation.messages.push(marcusMessage);
    conversation.updatedAt = new Date();
    await syncToDisk();
    res.json({ userMessage, marcusMessage, conversation });
  } catch (error) { console.error(error); res.status(500).json({ error: 'Server Error' }); }
});

// Server Start
const server = app.listen(PORT, async () => {
  await initializeDatabase();
  await loadScript(SCRIPT_FILE);
  console.log(`\n Marcus Aurelius Server running on port ${ PORT }`);
});
server.timeout = 60000;