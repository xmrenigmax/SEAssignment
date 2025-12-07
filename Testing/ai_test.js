/**
 * @file ai_test.js
 * @description Integration Test for the Llama 3.1 AI connection.
 * Usage: node tests/ai_test.js
 */

const BASE_URL = 'http://localhost:5000/api';
// Color setup
const COLORS = { reset: "\x1b[0m", cyan: "\x1b[36m", yellow: "\x1b[33m", green: "\x1b[32m", red: "\x1b[31m", gray: "\x1b[90m" };
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Helper functions - create conversation
 * @returns {string} Conversation ID
 */
async function createConversation() {
  const MAX_RETRIES = 3;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(`${BASE_URL}/conversations`, { method: 'POST' });
      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      return data.id;
    } catch (e) {
      if (attempt === MAX_RETRIES) {
        console.error(`\n${COLORS.red}Critical Error: Server not running or refusing connection.${COLORS.reset}`);
        process.exit(1);
      }
      await sleep(1000);
    }
  }
}

/**
 * Helper functions - send message
 * @param {string} id Conversation ID
 * @param {string} text Message text
 * @returns {string} Marcus's reply
 */
async function askMarcus(id, text) {
  const start = Date.now();
  // Client timeout set to 70s
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

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`${res.status} - ${errorText.substring(0, 100)}`);
    }

    const data = await res.json();
    const duration = (Date.now() - start) / 1000;
    return { text: data.marcusMessage.text, time: duration };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Testing
 */
(async () => {
  console.log(`\n${ COLORS.green } STARTING AI AMBITION TEST (Llama 3.1)...${ COLORS.reset }\n`);
  const id = await createConversation();
  console.log(`${ COLORS.gray } Conversation ID: ${id}${ COLORS.reset }`);

  const prompts = [
    "I lost my job yesterday and I feel like a failure.",
    "Why do we exist?"
  ];

  // Loops through prompts
  for (const prompt of prompts) {
    console.log(`${ COLORS.cyan }User:${ COLORS.reset } "${ prompt }"`);
    process.stdout.write(`${ COLORS.green }(Consulting the Oracle...)${ COLORS.reset }`);

    try {
      const result = await askMarcus(id, prompt);
      // Clear the "Consulting..." line
      process.stdout.clearLine();
      process.stdout.cursorTo(0);

      console.log(`${COLORS.yellow}Marcus (${result.time.toFixed(1)}s):${COLORS.reset} ${result.text}\n`);

      // Brief pause between questions
      await sleep(2000);
    } catch (err) {
      process.stdout.clearLine();
      process.stdout.cursorTo(0);

      // Detect common errors
      let msg = err.message;
      if (err.name === 'AbortError') msg = "Client Timeout (Server took too long)";

      console.log(`\n${COLORS.red}Error:${COLORS.reset} ${msg}\n`);
    }
  }
})();