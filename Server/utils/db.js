/**
 * @file utils/db.js
 * @description Robust MongoDB connection handler.
 * Updated to respect existing connections (for Testing).
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI missing in .env file');
}

let cached = global.mongoose || { conn: null, promise: null };

async function connectToDatabase() {
  // 1. FIX: Check if Mongoose is ALREADY connected (e.g., by Jest)
  // readyState 1 means "Connected"
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  // 2. Check internal cache
  if (cached.conn) return cached.conn;

  // 3. Establish new connection if neither exists
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    };
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => mongoose);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectToDatabase;