/**
 * @file uploadMiddleware.js
 * @description Middleware configuration for handling file uploads via Multer.
 * Stores files in RAM for serverless compatibility.
 * @author Group 1
 */

import multer from 'multer';

/**
 * @description Store files in RAM.
 * Limit: 4MB.
 */
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 4 * 1024 * 1024
  }
});