/**
 * @file aiService.js
 * @description Service layer for handling external AI API interactions (Hugging Face).
 * @author Group 1
 */

import dotenv from 'dotenv';

dotenv.config();

const HF_ROUTER_URL = 'https://router.huggingface.co/v1/chat/completions';
const MODEL_ID = 'meta-llama/Llama-3.1-8B-Instruct';
const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;

/**
 * @function fetchWithTimeout
 * @description Wrapper for fetch with a timeout controller.
 * @param {string} url - The URL to fetch.
 * @param {object} options - Fetch options.
 * @param {number} timeout - Timeout in milliseconds (default 40000).
 * @returns {Promise<Response>} The fetch response.
 */
async function fetchWithTimeout(url, options, timeout = 40000) {
  // AbortController allows us to cancel the fetch if it takes too long
  // 40 seconds is generous for LLM inference (average: 2-5s, worst case: 30s)
  // Without this, a hung connection would block the server indefinitely
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

/**
 * @function generateAIResponse
 * @description Sends the prompt to Hugging Face and retrieves the AI response.
 * @param {string} fullPrompt - The combined context and user text.
 * @returns {Promise<string|null>} The AI generated text or null if failed.
 */
export async function generateAIResponse(fullPrompt) {
  if (!HF_API_KEY) return null;

  try {
    const aiRes = await fetchWithTimeout(HF_ROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json'
      },
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
      return data.choices[0].message.content.replace(/<\|.*?\|>/g, '').trim();
    }
    return null;
  } catch (error) {
    console.error("AI Error, using fallback");
    return null;
  }
}