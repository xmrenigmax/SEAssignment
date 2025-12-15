/**
 * @file utils/db.js
 * @description Robust MongoDB connection handler.
 * Updated to respect existing connections (for Testing and Serverless).
 * @author Group 1
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI missing in .env file');
}

// Global cache to prevent multiple connections in Serverless (Vercel)
let cached = global.mongoose || { conn: null, promise: null };

/**
 * @function connectToDatabase
 * @description Connects to MongoDB, reusing the existing connection if available.
 * @returns {Promise<mongoose.Connection>} The database connection.
 */
async function connectToDatabase() {
  // ReadyState 1 means "Connected"
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  // Check internal cache
  if (cached.conn) return cached.conn;

  // Establish new connection if neither exists
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    };
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => mongoose);
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

export default connectToDatabase;