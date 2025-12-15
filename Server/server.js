/**
 * @file server.js
 * @description Main Express server for the Marcus Aurelius Chatbot.
 * Uses Vercel (Serverless) + MongoDB Atlas.
 * Refactored into MVC-S architecture.
 * @author Group 1
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';

// Logic & DB
import connectToDatabase from './utils/db.js';
import { loadScript } from './utils/logicEngine.js';

// Routes & Middleware
import conversationRoutes from './routes/conversationRoutes.js';
import { limiter } from './middleware/rateLimitMiddleware.js';

// CONFIGURATION
dotenv.config();
const PORT = process.env.PORT || 5000;

// Express Setup
const app = express();

// Secure HTTP Headers
app.use(helmet());

// Cors
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'https://marcusaurelius-client.vercel.app'],
  credentials: true
}));

// Apply Rate Limiting globally to /api routes
app.use('/api/', limiter);

// Body Parsers
app.use(express.json({ limit: '10mb' }));

// Mount Routes
app.use('/api', conversationRoutes);

// Startup Logic (Local vs Serverless)
if (process.argv[1].endsWith('server.js')) {
  app.listen(PORT, async () => {
    await connectToDatabase();

    // Initialize semantic engine (loads ML model)
    try {
      console.log('Initializing NLP Semantic Engine...');
      await initializeSemanticEngine();
      console.log('Semantic Engine Ready');
    } catch (error) {
      console.warn('Semantic Engine failed to load. Using keyword-only matching:', error.message);
    }

    await loadScript();
    console.log(`\n Marcus Aurelius Server running on port ${ PORT }`);
    console.log(`Connected to MongoDB Atlas`);
  });
}

// Export for Vercel
export default app;