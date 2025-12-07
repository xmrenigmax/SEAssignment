/**
 * @file ai_test.js
 * @description UPDATED: 60s timeout to allow DeepSeek to "think".
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api';
const COLORS = { reset: "\x1b[0m", cyan: "\x1b[36m", yellow: "\x1b[33m", green: "\x1b[32m", red: "\x1b[31m", gray: "\x1b[90m" };

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function createConversation() {
  try {
    const res = await fetch(`${BASE_URL}/conversations`, { method: 'POST' });
    const data = await res.json();
    return data.id;
  } catch (e) {
    console.error("Server not running.");
    process.exit(1);
  }
}

async function askMarcus(id, text) {
  const start = Date.now();
  
  // INCREASED TIMEOUT TO 60 SECONDS
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); 

  try {
    const res = await fetch(`${BASE_URL}/conversations/${id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal: controller.signal
    });
    
    if (!res.ok) throw new Error(await res.text());
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
  const prompts = [
    "I lost my job yesterday and I feel like a failure.",
    "Tell me about a time you were afraid in battle."
  ];

  for (const prompt of prompts) {
    console.log(`${COLORS.cyan}User:${COLORS.reset} "${prompt}"`);
    process.stdout.write(`${COLORS.green}(Thinking - could take 30s...)${COLORS.reset}`);
    
    try {
      const result = await askMarcus(id, prompt);
      process.stdout.clearLine();
      process.stdout.cursorTo(0);
      console.log(`${COLORS.yellow}Marcus (${result.time.toFixed(1)}s):${COLORS.reset} ${result.text}\n`);
      await sleep(2000);
    } catch (err) {
      console.log(`\n${COLORS.red}Error:${COLORS.reset} ${err.message}\n`);
    }
  }
})();