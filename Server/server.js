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
const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
const HF_API_URL = 'https://router.huggingface.co/v1/chat/completions';

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
 * Fallback using the inference API if router fails
 */
async function tryInferenceAPI(userMessage, apiKey) {
  try {
    console.log("🔄 Attempting inference API with DeepSeek...");

    const response = await fetch('https://api-inference.huggingface.co/models/deepseek-ai/DeepSeek-R1-Distill-Qwen-32B', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: `You are Marcus Aurelius. Respond with stoic wisdom to: ${userMessage}\nMarcus Aurelius: do not mention that you are marcus aurelius just be him and respond`,
        parameters: {
          max_new_tokens: 100,
          temperature: 0.7,
          return_full_text: false
        }
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data[0]?.generated_text || getFallback();
    } else {
      const errorText = await response.text();
      console.error("Inference API also failed:", errorText);
      return getFallback();
    }
  } catch (error) {
    console.error('Inference API error:', error.message);
    return getFallback();
  }
}

/**
 * Generates a response from Marcus Aurelius (Powered by DeepSeek).
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
    // 2. Prepare Payload for DeepSeek model
    const messages = [
      {
        role: "system",
        content: "IMPORTANT: You are Marcus Aurelius. Respond directly as him with Stoic wisdom. DO NOT explain your thinking process. DO NOT mention that you are an AI or Marcus Aurelius. DO NOT use phrases like 'As Marcus Aurelius' or 'I would say'. Just speak directly as him. Keep responses to 1-2 sentences maximum. Be profound but practical."
      },
      {
        role: "user",
        content: userMessage
      }
    ];

    console.log("⏳ Sending request to DeepSeek model...");

    const response = await fetch(HF_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-32B',
        messages: messages,
        max_tokens: 150,
        temperature: 0.7,
        top_p: 0.9,
        stream: false
      }),
    });

    // --- ENHANCED ERROR LOGGING ---
    if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ --- API REQUEST FAILED ---");
        console.error(`Status: ${response.status} ${response.statusText}`);
        console.error("Body:", errorText);
        console.error("-----------------------------");

        if (errorText.includes("loading")) {
          return "My mind is gathering its thoughts... (Model is loading, please try again in 30 seconds).";
        }

        // Try alternative approach with inference API
        console.log("🔄 Trying inference API endpoint...");
        return await tryInferenceAPI(userMessage, HF_API_KEY);
    }

    const data = await response.json();
    console.log("✅ AI Response Received - Full Data:", JSON.stringify(data, null, 2));

    // Extract response from different possible formats
    let aiText = data.choices?.[0]?.message?.content ||
      data[0]?.generated_text ||
      data.generated_text ||
      getFallback();
      console.log("📝 Raw AI Text:", aiText);

    // Clean up the response - remove thinking processes and explanations
    const cleanedText = aiText
      .replace(/<think>.*?<\/think>/g, '') // Remove <think> tags
      .replace(/\(.*?\)/g, '') // Remove parentheses content
      .replace(/As (Marcus Aurelius|an AI).*?,/g, '') // Remove AI explanations
      .replace(/User:|Marcus:|As an AI assistant,?/g, '')
      .replace(/I think.*?\./g, '') // Remove "I think" explanations
      .replace(/\b(Firstly|Secondly|Finally).*?\./g, '') // Remove numbered explanations
      .trim();

    console.log("✨ Cleaned Response:", cleanedText);

    return cleanedText || getFallback();

  } catch (error) {
    console.error('⚠️ General AI Error:', error.message);
    return getFallback();
  }
}

// ==========================================
// API ROUTES
// ==========================================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'Server is running',
    model: 'DeepSeek-R1-Distill-Qwen-32B',
    logic_engine: 'Active'
  });
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
  console.log(`🤖 AI Model: DeepSeek-R1-Distill-Qwen-32B`);
});