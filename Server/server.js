/**
 * @file server.js
 * @description Main Express server for the Historical Figure Chatbot.
 * Handles API routing, JSON logic processing, and HF Inference integration.
 * Fulfills FR4 (Backend), FR5 (JSON Logic), and FR11 (AI Integration).
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
// FIX: Trying the direct Router URL (Removed extra /hf-inference path)
const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
// If this fails, the error logs below will tell us exactly why
const HF_API_URL = 'https://router.huggingface.co/models/facebook/blenderbot-400M-distill';

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5173',
      'http://127.0.0.1:5173'
    ];
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

async function loadConversations() {
  try {
    await ensureDataDir();
    const data = await fs.readFile(CONVERSATIONS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
}

async function saveConversations(conversations) {
  await ensureDataDir();
  await fs.writeFile(CONVERSATIONS_FILE, JSON.stringify(conversations, null, 2));
}

/**
 * Generates a response from Marcus Aurelius (Powered by BlenderBot).
 */
async function getMarcusResponse(userMessage, conversationHistory = []) {
  
  // 1. Check Local JSON Logic First (Priority: Must Requirement FR5/FR7)
  const scriptedResponse = checkScriptedResponse(userMessage);
  if (scriptedResponse) {
    console.log(`[Logic Engine] Matched keyword in: "${userMessage}"`);
    return scriptedResponse;
  }

  // --- DEBUGGING START ---
  console.log("\n--- AI Debug Check ---");
  console.log("Target URL:", HF_API_URL);
  console.log("Key Configured:", !!HF_API_KEY);
  
  if (!HF_API_KEY || HF_API_KEY.includes('your_huggingface_api_key')) {
    console.log("⚠️ Using Fallback: No API Key found.");
    return getFallback();
  }
  // --- DEBUGGING END ---

  try {
    // 2. Prepare Payload
    const previousLines = conversationHistory.slice(-2).map(msg => 
        msg.isUser ? `User: ${msg.text}` : `Marcus: ${msg.text}`
    ).join('\n');
    
    const fullInput = `Persona: I am Marcus Aurelius, Roman Emperor. I speak with Stoic wisdom.\n${previousLines}\nUser: ${userMessage}\nMarcus:`;

    console.log("⏳ Sending request to Hugging Face...");
    
    const response = await fetch(HF_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: fullInput,
        parameters: { 
            max_new_tokens: 60,
            temperature: 0.7,
            return_full_text: false 
        }
      }),
    });

    // --- ENHANCED ERROR LOGGING ---
    if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ --- API REQUEST FAILED ---");
        console.error(`Status: ${response.status} ${response.statusText}`);
        console.error("Headers:", JSON.stringify([...response.headers.entries()]));
        console.error("Body (The Clue):", errorText); // THIS IS WHAT WE NEED
        console.error("-----------------------------");
        
        if (errorText.includes("loading")) {
             return "My mind is gathering its thoughts... (Model is loading, please try again in 10 seconds).";
        }
        throw new Error(`HF Status: ${response.status}`);
    }

    const data = await response.json();
    console.log("✅ AI Response Received");
    
    let aiText = data[0]?.generated_text || getFallback();
    return aiText.replace(/User:|Marcus:/g, '').trim();

  } catch (error) {
    console.error('⚠️ General AI Error:', error.message);
    return getFallback();
  }
}

// ==========================================
// API ROUTES
// ==========================================

app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', model: 'Facebook BlenderBot (Debug Mode)' });
});

app.get('/api/conversations', async (req, res) => {
  try {
    const conversations = await loadConversations();
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load conversations' });
  }
});

app.get('/api/conversations/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const conversations = await loadConversations();
    const conversation = conversations[conversationId];
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    res.json(conversation);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load conversation' });
  }
});

app.delete('/api/conversations/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const conversations = await loadConversations();
    if (conversations[conversationId]) {
      delete conversations[conversationId];
      await saveConversations(conversations);
    }
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete' });
  }
});

app.post('/api/conversations', async (req, res) => {
  try {
    const conversationId = uuidv4();
    const conversations = await loadConversations();
    const newConversation = {
      id: conversationId,
      title: 'New Council',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    conversations[conversationId] = newConversation;
    await saveConversations(conversations);
    res.status(201).json(newConversation);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

app.post('/api/conversations/:conversationId/messages', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { text } = req.body;
    
    if (!text) return res.status(400).json({ error: 'Message required' });
    
    const conversations = await loadConversations();
    const conversation = conversations[conversationId];
    
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    
    const userMessage = {
      id: uuidv4(),
      text: text,
      isUser: true,
      timestamp: new Date().toISOString()
    };
    conversation.messages.push(userMessage);
    
    const marcusResponse = await getMarcusResponse(text, conversation.messages);
    
    const marcusMessage = {
      id: uuidv4(),
      text: marcusResponse,
      isUser: false,
      timestamp: new Date().toISOString()
    };
    conversation.messages.push(marcusMessage);
    conversation.updatedAt = new Date().toISOString();

    if (conversation.messages.length <= 2) {
      conversation.title = text.slice(0, 30) + "...";
    }
    
    await saveConversations(conversations);
    res.json({ userMessage, marcusMessage, conversation });
    
  } catch (error) {
    console.error('Error processing message:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

// Start server
app.listen(PORT, async () => {
  await ensureDataDir();
  await loadScript(SCRIPT_FILE); 
  console.log(`\n🏛️  Marcus Aurelius Server running on port ${PORT}`);
  console.log(`📜 Logic Engine: Loaded from ${SCRIPT_FILE}`);
  console.log(`🤖 AI Model: Facebook BlenderBot (Diagnostic Mode)`);
});