/**
 * @file server.js
 * @description Main Express server for the Marcus Aurelius Chatbot.
 * Uses Vercel (Serverless) + MongoDB Atlas.
 * @author Group 1
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';

// Logic & DB
import connectToDatabase from './utils/db.js';
import { Conversation } from './models/Conversations.js';
import { loadScript, checkScriptedResponse, getFallback } from './utils/logicEngine.js';

// CONFIGURATION
dotenv.config();
const PORT = process.env.PORT || 5000;

// External Services
const HF_ROUTER_URL = 'https://router.huggingface.co/v1/chat/completions';
const MODEL_ID = 'meta-llama/Llama-3.1-8B-Instruct';
const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;

// Express Setup
const app = express();

// Secure HTTP Headers
app.use(helmet());

// Rate Limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, message: { error: "Too many requests, please contemplate in silence for a while." }});
app.use('/api/', limiter);

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// Store files in RAM
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 4 * 1024 * 1024 }});


async function fetchWithTimeout(url, options, timeout = 40000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally { clearTimeout(id); }
}

// Checks Health of System
app.get('/api/health', (req, res) => res.json({ status: 'OK', db: 'MongoDB Atlas' }));

// Gets All Conversations
app.get('/api/conversations', async (req, res) => {
  try {
    await connectToDatabase();
    // Return only IDs and Titles to save bandwidth (lean query)
    const convos = await Conversation.find({}, 'id title updatedAt createdAt').sort({ updatedAt: -1 });
    res.json(convos);
  } catch (error) {
    res.status(500).json({ error: "DB Error" });
  }
});

// Get A Conversation
app.get('/api/conversations/:id', async (req, res) => {
  try {
    await connectToDatabase();
    const convo = await Conversation.findOne({ id: req.params.id });
    if (!convo) return res.status(404).json({ error: 'Conversation not found' });
    res.json(convo);
  } catch (error) {
    res.status(500).json({ error: "DB Error" });
  }
});

// Creates Conversation
app.post('/api/conversations', async (req, res) => {
  try {
    await connectToDatabase();
    const newConvo = await Conversation.create({
      id: uuidv4(),
      title: 'New Council',
      messages: []
    });
    res.status(201).json(newConvo);
  } catch (error) {
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

// Deletes Conversation
app.delete('/api/conversations/:id', async (req, res) => {
  try {
    await connectToDatabase();
    await Conversation.deleteOne({ id: req.params.id });
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ error: "Delete failed" });
  }
});

// Deletes All
app.delete('/api/conversations', async (req, res) => {
  try {
    await connectToDatabase();
    await Conversation.deleteMany({});
    res.json({ message: 'All history erased' });
  } catch (error) {
    res.status(500).json({ error: "Wipe failed" });
  }
});

// Send Message
app.post('/api/conversations/:id/messages', upload.single('attachment'), async (req, res) => {
  try {
    await connectToDatabase();
    const { id } = req.params;
    const text = req.body.text || '';
    const file = req.file;

    const conversation = await Conversation.findOne({ id });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

    // Process Attachment (Buffer -> Base64)
    let fileData = null;
    let attachmentContext = '';

    if (file) {
      // Convert buffer to Base64 string for storage
      const base64String = file.buffer.toString('base64');
      const mimeType = file.mimetype;

      fileData = {
        name: file.originalname,
        type: mimeType,
        size: file.size,
        data: `data:${mimeType};base64,${base64String}`
      };

      if (mimeType.includes('text')) {
        attachmentContext = `[USER UPLOADED FILE: ${file.originalname}]:\n${file.buffer.toString('utf8')}\n`;
      } else {
        attachmentContext = `[SYSTEM: User uploaded an image/file named "${file.originalname}". Acknowledge this.]`;
      }
    }

    // Prepare User Message
    const userMsg = {
      id: uuidv4(),
      text,
      isUser: true,
      timestamp: new Date(),
      attachment: fileData
    };

    // Logic Engine / AI Response
    const fullPrompt = attachmentContext ? `${attachmentContext}\n\n${text}` : text;
    let aiText = checkScriptedResponse(text) || getFallback();

    // Only call API if no script match found
    if (!checkScriptedResponse(text) && HF_API_KEY) {
      try {
        const aiRes = await fetchWithTimeout(HF_ROUTER_URL, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${HF_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: MODEL_ID,
            messages: [
              { role: "system", content: "You are Marcus Aurelius. Be stoic, wise, and concise." },
              { role: "user", content: fullPrompt }
            ],
            max_tokens: 500
          })
        });
        const data = await aiRes.json();
        if (data.choices?.[0]?.message?.content) {
          aiText = data.choices[0].message.content.replace(/<\|.*?\|>/g, '').trim();
        }
      } catch (err) {
        console.error("AI Error, using fallback");
      }
    }

    // Prepare AI Message
    const aiMsg = {
      id: uuidv4(),
      text: aiText,
      isUser: false,
      timestamp: new Date()
    };

    // Update DB (Atomic Push)
    conversation.messages.push(userMsg, aiMsg);

    // Auto-Title Logic
    if (conversation.messages.length <= 2) {
      conversation.title = text.substring(0, 40) + (text.length > 40 ? '...' : '');
    }

    await conversation.save();

    // Respond to Frontend
    res.json({ userMessage: userMsg, marcusMessage: aiMsg, conversation });

  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Startup
if (process.argv[1].endsWith('server.js')) {
  app.listen(PORT, async () => {
    await connectToDatabase();
    await loadScript();
    console.log(`\n Marcus Aurelius Server running on port ${PORT}`);
    console.log(`Connected to MongoDB Atlas`);
  });
}

export default app;