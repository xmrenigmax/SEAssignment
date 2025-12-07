/**
 * @file ai_test.js
 * @description UPDATED: Added Retry logic for stable test setup.
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api';
const COLORS = { reset: "\x1b[0m", cyan: "\x1b[36m", yellow: "\x1b[33m", green: "\x1b[32m", red: "\x1b[31m", gray: "\x1b[90m" };
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function createConversation() {
  const MAX_RETRIES = 5;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(`${BASE_URL}/conversations`, { method: 'POST' });
      const data = await res.json();
      return data.id;
    } catch (e) {
      if (attempt === MAX_RETRIES) {
        console.error(`\n${COLORS.red}Critical Error: Server not running or refusing connection after ${MAX_RETRIES} attempts.${COLORS.reset}`);
        process.exit(1);
      }
      console.log(`${COLORS.yellow}Warning: Conversation creation failed. Retrying in 1s... (Attempt ${attempt})${COLORS.reset}`);
      await sleep(1000);
    }
  }
}

async function askMarcus(id, text) {
  const start = Date.now();
  // Ensure this timeout is slightly longer than the server timeout (45s + margin)
  const clientTimeout = 70000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), clientTimeout);

  try {
    const res = await fetch(`${BASE_URL}/conversations/${id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal: controller.signal
    });
    // If the server returns 500 or 404, we throw the message body (which might be the error text)
    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Server Response Error: ${res.status} - ${errorText.substring(0, 100)}...`);
    }
    const data = await res.json();
    const duration = (Date.now() - start) / 1000;
    return { text: data.marcusMessage.text, time: duration };
  } finally {
    clearTimeout(timeoutId);
  }
}

(async () => {
  console.log(`\n${COLORS.green}🏛️  STARTING AI QUALITY TEST (High Timeout)...${COLORS.reset}\n`);
  const id = await createConversation();
  console.log(`${COLORS.gray}Test Conversation ID: ${id}${COLORS.reset}`);
  const prompts = [
    "I lost my job yesterday and I feel like a failure.",
    "Tell me about a time you were afraid in battle."
  ];

  for (const prompt of prompts) {
    console.log(`${COLORS.cyan}User:${COLORS.reset} "${prompt}"`);
    process.stdout.write(`${COLORS.green}(Thinking - could take up to 45s...)${COLORS.reset}`);
    try {
      const result = await askMarcus(id, prompt);
      process.stdout.clearLine();
      process.stdout.cursorTo(0);
      console.log(`${COLORS.yellow}Marcus (${result.time.toFixed(1)}s):${COLORS.reset} ${result.text}\n`);
      await sleep(2000);
    } catch (err) {
      // Check if it's an abort error (timeout) or a network error
      const reason = err.code || err.message.split('reason: ')[1] || err.message;
      process.stdout.clearLine();
      process.stdout.cursorTo(0);
      console.log(`\n${COLORS.red}Error:${COLORS.reset} request failed, reason: ${reason}\n`);
    }
  }
})();