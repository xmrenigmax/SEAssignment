/**
 * @file conversationRoutes.js
 * @description Definition of API endpoints for conversation management.
 * @author Group 1
 */

import express from 'express';
import {
  getHealth,
  getAllConversations,
  getConversationById,
  createConversation,
  deleteConversation,
  deleteAllConversations,
  importConversations,
  sendMessage
} from '../controllers/conversationController.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Health Check
router.get('/health', getHealth);

// Conversation CRUD
router.get('/conversations', getAllConversations);
router.get('/conversations/:id', getConversationById);
router.post('/conversations', createConversation);
router.delete('/conversations/:id', deleteConversation);
router.delete('/conversations', deleteAllConversations);

// Import
router.post('/conversations/import', importConversations);

// Messaging (with upload middleware)
router.post('/conversations/:id/messages', upload.single('attachment'), sendMessage);

export default router;