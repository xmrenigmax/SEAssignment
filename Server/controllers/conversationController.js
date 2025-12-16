/**
 * @file conversationController.js
 * @description Controller logic for handling conversation CRUD and messaging.
 * @author Group 1
 */

import { v4 as uuidv4 } from 'uuid';
import { Conversation } from '../models/Conversations.js';
import connectToDatabase from '../utils/db.js';
import { checkScriptedResponse, getFallback } from '../utils/logicEngine.js';
import { generateAIResponse } from '../services/aiService.js';

/**
 * @function getHealth
 * @description Checks Health of System.
 */
export const getHealth = (req, res) => {
  res.json({ status: 'OK', db: 'MongoDB Atlas' });
};

/**
 * @function getAllConversations
 * @description Gets All Conversations (Lean query).
 */
export const getAllConversations = async (req, res) => {
  try {
    await connectToDatabase();
    // Return only IDs and Titles to save bandwidth (lean query)
    const convos = await Conversation.find({}, 'id title updatedAt createdAt').sort({ updatedAt: -1 });
    res.json(convos);
  } catch (error) {
    res.status(500).json({ error: "DB Error" });
  }
};

/**
 * @function getConversationById
 * @description Get A Conversation by ID.
 */
export const getConversationById = async (req, res) => {
  try {
    await connectToDatabase();
    const convo = await Conversation.findOne({ id: req.params.id });
    if (!convo) return res.status(404).json({ error: 'Conversation not found' });
    res.json(convo);
  } catch (error) {
    res.status(500).json({ error: "DB Error" });
  }
};

/**
 * @function createConversation
 * @description Creates a new Conversation.
 */
export const createConversation = async (req, res) => {
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
};

/**
 * @function deleteConversation
 * @description Deletes a specific conversation.
 */
export const deleteConversation = async (req, res) => {
  try {
    await connectToDatabase();
    await Conversation.deleteOne({ id: req.params.id });
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ error: "Delete failed" });
  }
};

/**
 * @function deleteAllConversations
 * @description Deletes All conversations.
 */
export const deleteAllConversations = async (req, res) => {
  try {
    await connectToDatabase();
    await Conversation.deleteMany({});
    res.json({ message: 'All history erased' });
  } catch (error) {
    res.status(500).json({ error: "Wipe failed" });
  }
};

/**
 * @function importConversations
 * @description Imports conversations via bulk write.
 */
export const importConversations = async (req, res) => {
  try {
    await connectToDatabase();
    const conversations = req.body;

    // Validation
    if (!Array.isArray(conversations) || conversations.length === 0) {
      return res.status(400).json({ error: "Invalid data: Expected an array of conversations." });
    }

    console.log(`[Import] Processing ${conversations.length} conversations...`);

    // Create Bulk Operations
    const operations = conversations.map(convo => ({
      updateOne: {
        filter: { id: convo.id },
        update: { $set: convo },
        upsert: true
      }
    }));

    // Execute Bulk Write
    if (operations.length > 0) {
      await Conversation.bulkWrite(operations);
    }

    console.log(`[Import] Success!`);
    res.json({ message: `Successfully imported ${conversations.length} conversations.` });

  } catch (error) {
    console.error("Import Error:", error);
    res.status(500).json({ error: "Server failed to import data." });
  }
};

/**
 * @function sendMessage
 * @description Handles user messages, file attachments, and AI responses.
 */
export const sendMessage = async (req, res) => {
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

    // Get the scripted response (awaited correctly)
    const scriptResponse = await checkScriptedResponse(text);

    // Use the variable 'scriptResponse'. Do not call the function again.
    let aiText = scriptResponse || getFallback();

    // Only call expensive API if no script match found
    if (!scriptResponse) {
      const generatedText = await generateAIResponse(fullPrompt);
      if (generatedText) {
        aiText = generatedText;
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
};