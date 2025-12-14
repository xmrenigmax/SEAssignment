/**
 * @file models/Conversations.js
 * @description Mongoose schema for storing chat history and file metadata.
 */

import mongoose from 'mongoose';

// Sub-Schema for Attachment
const AttachmentSchema = new mongoose.Schema({
  name: String,
  type: String,
  size: Number,
  data: String // Base64 data URI string
}, { _id: false });

// Message Schema
const MessageSchema = new mongoose.Schema({
  id: { type: String, required: true },
  text: { type: String, default: '' },
  isUser: { type: Boolean, required: true },
  timestamp: { type: Date, default: Date.now },
  attachment: {
    type: AttachmentSchema,
    default: null
  }
});

// Conversation Schema
const ConversationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, default: 'New Council' },
  messages: [MessageSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Script Schemas
const ResponseOptionSchema = new mongoose.Schema({
  probability: Number,
  response: String
}, { _id: false });

const RuleSchema = new mongoose.Schema({
  id: String,
  keywords: [String],
  response_pool: [ResponseOptionSchema]
}, { _id: false });

const ScriptSchema = new mongoose.Schema({
  configId: { type: String, default: 'main_config', unique: true },
  persona: String,
  general_responses: [ResponseOptionSchema],
  rules: [RuleSchema]
});

// Auto-update timestamp
ConversationSchema.pre('save', async function() {
  this.updatedAt = Date.now();
});

// Exports
export const Conversation = mongoose.model('Conversation', ConversationSchema);
export const Script = mongoose.model('Script', ScriptSchema);