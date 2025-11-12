// Imports
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
dotenv.config();

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5173', // Vite default
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

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Handle preflight requests
app.options('*', cors(corsOptions));

// Paths for JSON storage
const DATA_DIR = join(__dirname, 'data');
const CONVERSATIONS_FILE = join(DATA_DIR, 'conversations.json');

// Hugging Face API configuration
const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
const HF_API_URL = 'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium';

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

// Load conversations from JSON file
async function loadConversations() {
  try {
    await ensureDataDir();
    const data = await fs.readFile(CONVERSATIONS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // Return empty object if file doesn't exist
    return {};
  }
}

// Save conversations to JSON file
async function saveConversations(conversations) {
  await ensureDataDir();
  await fs.writeFile(CONVERSATIONS_FILE, JSON.stringify(conversations, null, 2));
}

// Get Marcus Aurelius response from Hugging Face API
async function getMarcusResponse(userMessage, conversationHistory = []) {
  if (!HF_API_KEY || HF_API_KEY === 'your_huggingface_api_key_here') {
    // Fallback responses if no API key is set
    const fallbackResponses = [
      "As Marcus Aurelius said: 'The happiness of your life depends upon the quality of your thoughts.'",
      "Remember this Stoic wisdom: 'You have power over your mind - not outside events. Realize this, and you will find strength.'",
      "In the words of Meditations: 'Waste no more time arguing what a good man should be. Be one.'",
      "Stoicism teaches: 'The impediment to action advances action. What stands in the way becomes the way.'",
      "I am Marcus Aurelius. While my technical servants work on deeper connections, know this: 'Very little is needed to make a happy life; it is all within yourself.'"
    ];
    return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
  }

  try {
    // Prepare conversation context for the model
    const context = conversationHistory
      .slice(-4) // Last 4 messages for context
      .map(msg => `${msg.isUser ? 'User' : 'Marcus'}: ${msg.text}`)
      .join('\n');
    
    const prompt = `You are Marcus Aurelius, the Roman Emperor and Stoic philosopher. Respond in character with Stoic wisdom. Keep responses under 2 sentences.

${context}
User: ${userMessage}
Marcus:`;

    const response = await fetch(HF_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_length: 150,
          temperature: 0.7,
          do_sample: true,
          return_full_text: false
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.status}`);
    }

    const data = await response.json();
    return data[0]?.generated_text || "I contemplate your words deeply...";
    
  } catch (error) {
    console.error('Hugging Face API error:', error);
    return "Even emperors face technical difficulties. Let us continue our philosophical discussion.";
  }
}

// API Routes

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'Server is running', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    features: ['Hugging Face Integration', 'JSON Storage', 'Conversation History'],
    huggingFace: HF_API_KEY && HF_API_KEY !== 'your_huggingface_api_key_here' ? 'Configured' : 'Using Fallback',
    cors: 'Enabled for localhost:3000 and localhost:5173'
  });
});

// Get all conversations (for debugging/export)
app.get('/api/conversations', async (req, res) => {
  try {
    const conversations = await loadConversations();
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load conversations' });
  }
});

// Get specific conversation
app.get('/api/conversations/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const conversations = await loadConversations();
    const conversation = conversations[conversationId];
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    
    res.json(conversation);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load conversation' });
  }
});

// Create new conversation
app.post('/api/conversations', async (req, res) => {
  try {
    const conversationId = uuidv4();
    const conversations = await loadConversations();
    
    const newConversation = {
      id: conversationId,
      title: 'Conversation with Marcus Aurelius',
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

// Send message to conversation
app.post('/api/conversations/:conversationId/messages', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { text, attachment } = req.body;
    
    if (!text && !attachment) {
      return res.status(400).json({ error: 'Message text or attachment required' });
    }
    
    const conversations = await loadConversations();
    const conversation = conversations[conversationId];
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    
    // Add user message
    const userMessage = {
      id: uuidv4(),
      text: text || '',
      isUser: true,
      timestamp: new Date().toISOString(),
      attachment: attachment || null
    };
    
    conversation.messages.push(userMessage);
    
    // Get Marcus Aurelius response
    const marcusResponse = await getMarcusResponse(text, conversation.messages);
    
    // Add Marcus response
    const marcusMessage = {
      id: uuidv4(),
      text: marcusResponse,
      isUser: false,
      timestamp: new Date().toISOString()
    };
    
    conversation.messages.push(marcusMessage);
    conversation.updatedAt = new Date().toISOString();
    
    // Update conversation title if it's the first message
    if (conversation.messages.length === 2) {
      conversation.title = text.slice(0, 30) + (text.length > 30 ? '...' : '');
    }
    
    await saveConversations(conversations);
    
    res.json({
      userMessage,
      marcusMessage,
      conversation: conversation
    });
    
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Delete conversation
app.delete('/api/conversations/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const conversations = await loadConversations();
    
    if (!conversations[conversationId]) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    
    delete conversations[conversationId];
    await saveConversations(conversations);
    
    res.json({ message: 'Conversation deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

// Start server
app.listen(PORT, async () => {
  await ensureDataDir();
  console.log(`Marcus Aurelius Chatbot Server running on port ${PORT}`);
  console.log(`Data directory: ${DATA_DIR}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`CORS: Enabled for localhost:3000 and localhost:5173`);
  console.log(`Hugging Face: ${HF_API_KEY && HF_API_KEY !== 'your_huggingface_api_key_here' ? '✅ Configured' : '🔄 Using Fallback Responses'}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Frontend should be running on: http://localhost:3000`);
});