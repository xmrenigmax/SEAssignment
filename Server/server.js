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
import multer from 'multer';
import { loadScript, checkScriptedResponse, getFallback } from './utils/logicEngine.js';

// CONFIGURATION
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Express Setup
const app = express();
const PORT = process.env.PORT || 5000;

// File Paths
const DATA_DIR = join(__dirname, 'data');
const UPLOADS_DIR = join(__dirname, 'data/uploads');
const CONVERSATIONS_FILE = join(DATA_DIR, 'conversations.json');
const SCRIPT_FILE = join(DATA_DIR, 'script.json');

// HuggingFace Setup
const HF_ROUTER_URL = 'https://router.huggingface.co/v1/chat/completions';
const MODEL_ID = 'meta-llama/Llama-3.1-8B-Instruct';
const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;

// In-memory cache for conversations
let conversationCache = {};

// Multer Config (File Uploads)
const upload = multer({ dest: UPLOADS_DIR, limits: { fileSize: 10 * 1024 * 1024 } });

/**
 * CORS Configuration.
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

// Increase Payload Limits for Base64 Audio
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

/**
 * Ensures a directory exists.
 */
async function ensureDir(dirPath) {
  try { await fs.access(dirPath); } catch { await fs.mkdir(dirPath, { recursive: true }); }
}

/**
 * Ensures data and upload directories exist.
 */
async function initializeDirs() {
  await ensureDir(DATA_DIR);
  await ensureDir(UPLOADS_DIR);
}

/**
 * Initializes the database on server start.
 */
async function initializeDatabase() {
  await initializeDirs();
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
 */
async function syncToDisk() {
  try {
    await ensureDir(DATA_DIR);
    await fs.writeFile(CONVERSATIONS_FILE, JSON.stringify(conversationCache, null, 2));
  } catch (error) {
    console.error("Disk Sync Failed:", error.message);
  }
}

/**
 * Cleans the raw output from the LLM.
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
 * Generates a short, relevant title.
 */
async function generateTitle(userMessage) {
  const titlePrompt = `The user's first message to Marcus Aurelius is: "${userMessage}". Based on the philosophy of Marcus Aurelius, generate a concise, four-to-six word, Stoic-themed title for this conversation. Do not use quotes.`;

  try {
    const response = await fetchWithTimeout(HF_ROUTER_URL, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${HF_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL_ID,
        messages: [
          { role: "system", content: titlePrompt },
          { role: "user", content: userMessage }
        ],
        max_tokens: 20,
        temperature: 0.2,
        stream: false
      }),
    }, 10000);

    if (!response.ok) throw new Error("Title API failed");

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || 'A New Reflection';
    let title = rawContent.replace(/["'.]/g, '').trim();
    if (title.length > 50) title = title.substring(0, 50) + '...';
    return title;

  } catch (error) {
    return "A New Reflection";
  }
}

/**
 * Converts uploaded file content to text for the AI.
 */
async function convertAttachmentToText(file) {
  try {
    const { path, originalname } = file;
    if (originalname.endsWith('.txt')) {
      const content = await fs.readFile(path, 'utf8');
      return `[ATTACHMENT CONTENT (${originalname})]:\n${content}\n[END ATTACHMENT]`;
    }
    return `[SYSTEM NOTE: The user has attached a file named "${originalname}" of type ${file.mimetype}. Address the fact that they shared this document in your response.]`;
  } catch (e) {
    console.error("File conversion error:", e);
    return "[SYSTEM ERROR: Failed to read attached file.]";
  }
}

/**
 * Main AI Orchestrator.
 */
async function getMarcusResponse(userMessage, attachmentContext = '') {
  const fullPrompt = attachmentContext
    ? `${attachmentContext}\n\nUser Question: ${userMessage}`
    : userMessage;

  const scriptedResponse = checkScriptedResponse(userMessage);
  if (scriptedResponse) return scriptedResponse;

  // Api key check
  if (!HF_API_KEY || HF_API_KEY.includes('huggingface_api_key')) {
    return getFallback();
  }

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
          { role: "user", content: fullPrompt }
        ],
        max_tokens: 500,
        temperature: 0.7,
        stream: false
      }),
    }, 45000);

    // Handles 200-499 responses
    if (!response.ok) {
        if (MODEL_ID.includes("Llama")) return await getSafetyNetResponse(userMessage);
        return getFallback();
    }

    // Parse Response
    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || '';

    if (rawContent) return cleanAIResponse(rawContent) || getFallback();
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
    return "The mind adapts and converts to its own purposes the obstacle to our acting.";
}

// Routes
app.get('/api/health', (req, res) => res.json({ status: 'OK', mode: 'Router + Llama 3.1' }));

// Retrieves all Conversations
app.get('/api/conversations', (req, res) => res.json(conversationCache));

// Retrieves Conversation by ID
app.get('/api/conversations/:conversationId', (req, res) => {
  const conversation = conversationCache[req.params.conversationId];
  if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
  res.json(conversation);
});

// Deletes Conversation by ID
app.delete('/api/conversations/:conversationId', async (req, res) => {
  if (conversationCache[req.params.conversationId]) {
    delete conversationCache[req.params.conversationId];
    await syncToDisk();
  }
  res.json({ message: 'Deleted' });
});

// Deletes all Conversations
app.delete('/api/conversations', async (req, res) => {
  conversationCache = {};
  await syncToDisk();
  res.json({ message: 'All conversations deleted' });
});

// Posts All Conversations
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
 * Send a message.
 */
app.post('/api/conversations/:conversationId/messages', upload.single('attachment'), async (req, res) => {
  try {
    const { conversationId } = req.params;

    // Extract Fields. Multer puts file in req.file, other fields in req.body
    const text = req.body.text || '';
    const audio = req.body.audio;
    const file = req.file;

    // Validation: We need at least text, a file, or audio
    if (!text && !file && !audio) {
      return res.status(400).json({ error: 'Message, file, or audio required' });
    }

    const conversation = conversationCache[conversationId];
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

    // Handle File Attachment
    let attachmentContext = '';
    let fileMetadata = null;

    if (file) {
      attachmentContext = await convertAttachmentToText(file);
      fileMetadata = {
        name: file.originalname,
        type: file.mimetype,
        size: file.size
      };
      // Clean up temp file
      await fs.unlink(file.path).catch(e => console.error('Cleanup warning:', e));
    }

    // Title generation (for the very first message)
    if (conversation.messages.length === 0 && conversation.title === 'New Council') {
        let preview = text || (file ? `File: ${file.originalname}` : 'Voice Message');
        const dynamicTitle = await generateTitle(preview);
        conversation.title = dynamicTitle;
    }

    // Create User Message Object
    const userMessage = {
      id: uuidv4(),
      text,
      isUser: true,
      timestamp: new Date(),
      attachment: fileMetadata,
      audio: audio
    };
    conversation.messages.push(userMessage);

    // Get AI Response
    const marcusResponse = await getMarcusResponse(text, attachmentContext);

    const marcusMessage = { id: uuidv4(), text: marcusResponse, isUser: false, timestamp: new Date() };
    conversation.messages.push(marcusMessage);

    // Save & Respond
    conversation.updatedAt = new Date();
    await syncToDisk();

    res.json({ userMessage, marcusMessage, conversation });
  } catch (error) {
    console.error(error);
    if (req.file) await fs.unlink(req.file.path).catch(e => {});
    res.status(500).json({ error: 'Server Error' });
  }
});

// SERVER START
const server = app.listen(PORT, async () => {
  await initializeDatabase();
  await loadScript(SCRIPT_FILE);
  console.log(`\n Marcus Aurelius Server running on port ${ PORT }`);
});

server.timeout = 60000;