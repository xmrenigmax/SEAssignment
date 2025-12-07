/**
 * @file server.js
 * @description Main Express server for the Historical Figure Chatbot.
 * OPTIMIZED: Uses In-Memory caching to prevent file locking during stress tests.
 * @author Group 1
 */

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

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Path configurations
const DATA_DIR = join(__dirname, 'data');
const CONVERSATIONS_FILE = join(DATA_DIR, 'conversations.json');
const SCRIPT_FILE = join(DATA_DIR, 'script.json');

// Hugging Face API configuration
const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
const HF_API_URL = 'https://router.huggingface.co/v1/chat/completions';

// --- 🧠 IN-MEMORY DATABASE ---
// Prevents EBUSY/Race conditions by keeping state in RAM
let conversationCache = {};

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

// --- File System Helpers ---

async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

/**
 * Loads conversations from disk into RAM at startup.
 */
async function initializeDatabase() {
  await ensureDataDir();
  try {
    const data = await fs.readFile(CONVERSATIONS_FILE, 'utf8');
    conversationCache = JSON.parse(data);
    console.log(`📦 Database loaded: ${Object.keys(conversationCache).length} conversations.`);
  } catch (error) {
    console.log("⚠️ No existing database found. Starting fresh.");
    conversationCache = {};
  }
}

/**
 * Saves RAM cache to disk.
 * We await this, but catch errors so the server doesn't crash.
 */
async function syncToDisk() {
  try {
    await ensureDataDir();
    await fs.writeFile(CONVERSATIONS_FILE, JSON.stringify(conversationCache, null, 2));
  } catch (error) {
    console.error("❌ Disk Sync Failed (Non-fatal):", error.message);
  }
}

// --- AI Response Cleaning ---

function cleanAIResponse(text) {
  if (!text) return '';
  let cleaned = text;

  // Remove <think> blocks
  while (cleaned.includes('<think>')) {
    cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '');
    if (cleaned.includes('<think>') && !cleaned.includes('</think>')) {
      cleaned = cleaned.split('<think>')[0];
    }
  }

  // Remove Noise
  cleaned = cleaned
    .replace(/^(Marcus( Aurelius)?|The Emperor|Stoic):/gmi, '')
    .replace(/^As (an )?AI.*?,/gmi, '')
    .replace(/User:.*$/gmi, '')
    .replace(/^\s*["']|["']\s*$/g, '')
    .replace(/\(.*?\)/g, '')
    .trim();

  return cleaned;
}

// --- AI Integration ---

async function tryInferenceAPI(userMessage, apiKey) {
  try {
    console.log("🔄 Attempting inference API with DeepSeek...");
    const response = await fetch('https://api-inference.huggingface.co/models/deepseek-ai/DeepSeek-R1-Distill-Qwen-32B', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inputs: `You are Marcus Aurelius. Respond to: ${userMessage}`,
        parameters: { max_new_tokens: 150, temperature: 0.7, return_full_text: false }
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const rawText = data[0]?.generated_text;
      return rawText ? cleanAIResponse(rawText) : getFallback();
    } else {
      console.error("Inference API failed:", await response.text());
      return getFallback();
    }
  } catch (error) {
    console.error('Inference API error:', error.message);
    return getFallback();
  }
}

async function getMarcusResponse(userMessage) {
  // 1. Check Logic Engine
  const scriptedResponse = checkScriptedResponse(userMessage);
  if (scriptedResponse) {
    return scriptedResponse;
  }

  // 2. AI Fallback
  if (!HF_API_KEY || HF_API_KEY.includes('your_huggingface_api_key')) {
    console.log("⚠️ No API Key - Using Scripted Fallback");
    return getFallback();
  }

  try {
    console.log("⏳ Asking DeepSeek...");
    const response = await fetch(HF_API_URL, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${HF_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-32B',
        messages: [
          { 
            role: "system", 
            content: "IMPORTANT: You are Marcus Aurelius. Respond with **Stoic wisdom**. You **must not** say you do not know something unless it is post-20th century tech. Do not use <think> tags." 
          },
          { role: "user", content: userMessage }
        ],
        max_tokens: 200,
        temperature: 0.7,
        stream: false
      }),
    });

    if (!response.ok) {
      if ((await response.text()).includes("loading")) return "The mind prepares... (Loading model)";
      return await tryInferenceAPI(userMessage, HF_API_KEY);
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || data[0]?.generated_text || '';
    
    // Debug Log
    console.log("📝 Raw AI:", rawContent.substring(0, 50) + "..."); 
    
    const finalResponse = cleanAIResponse(rawContent);
    console.log("✨ Cleaned:", finalResponse);

    return finalResponse || getFallback();

  } catch (error) {
    console.error('AI Error:', error.message);
    return getFallback();
  }
}

// --- ROUTES (In-Memory) ---

app.get('/api/health', (req, res) => res.json({ status: 'OK', mode: 'In-Memory' }));

app.get('/api/conversations', (req, res) => {
  res.json(conversationCache);
});

app.get('/api/conversations/:conversationId', (req, res) => {
  const { conversationId } = req.params;
  const conversation = conversationCache[conversationId];
  if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
  res.json(conversation);
});

app.delete('/api/conversations/:conversationId', async (req, res) => {
  const { conversationId } = req.params;
  if (conversationCache[conversationId]) {
    delete conversationCache[conversationId];
    await syncToDisk();
  }
  res.json({ message: 'Deleted' });
});

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
    await syncToDisk(); // Save periodically

    res.json({ userMessage, marcusMessage, conversation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
});

// Start server
app.listen(PORT, async () => {
  await initializeDatabase();
  await loadScript(SCRIPT_FILE);
  console.log(`\n🏛️  Marcus Aurelius Server running on port ${PORT}`);
});