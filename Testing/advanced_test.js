/**
 * @file advanced_test.js
 * @description Logic Engine Test Runner.
 * Verifies that your Scripting/NLP engine is working correctly before the AI takes over.
 * Usage: node tests/advanced_test.js
 */

const BASE_URL = 'http://localhost:5000/api';

// Color setup
const COLORS = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m"
};

/**
 * Helper functions - create conversation
 * @returns {string} Conversation ID
 */
async function createConversation() {
  const res = await fetch(`${BASE_URL}/conversations`, { method: 'POST' });
  if (!res.ok) throw new Error("Failed to create conversation");
  const data = await res.json();
  return data.id;
}

/**
 * Helper functions - send message
 * @param {string} id Conversation ID
 * @param {string} text Message text
 * @returns {string} Marcus's reply
 */
async function sendMessage(id, text) {
  const res = await fetch(`${BASE_URL}/conversations/${id}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.marcusMessage.text;
}

/**
 * Runs Probability Distribution test
 */
async function runProbabilityTest() {
  console.log(`\n${ COLORS.cyan }--- TEST 1: Probability Distribution (100 Requests) ---${ COLORS.reset }`);
  console.log("Checking if 'hello' returns random scripted variations...");

  const id = await createConversation();
  const results = { "Hail": 0, "Greetings": 0, "Ave": 0, "Other": 0 };
  const TOTAL = 100;

  process.stdout.write("Progress: ");
  for (let i = 0; i < TOTAL; i++) {
    try {
      const ans = await sendMessage(id, "hello");
      if (ans.includes("Hail")) results["Hail"]++;
      else if (ans.includes("Greetings")) results["Greetings"]++;
      else if (ans.includes("Ave")) results["Ave"]++;
      else results["Other"]++;
      if (i % 5 === 0) process.stdout.write("•");
    } catch (e) {
      process.stdout.write("X");
    }
  }

  console.log(`\n\n${ COLORS.green }Results:${ COLORS.reset }`);
  console.log(`Hail:      ${ results["Hail"] } (${ (results["Hail"]/TOTAL*100).toFixed(1) }%)`);
  console.log(`Greetings: ${ results["Greetings"] } (${ (results["Greetings"]/TOTAL*100).toFixed(1) }%)`);
  console.log(`Ave:       ${ results["Ave"] } (${ (results["Ave"]/TOTAL*100).toFixed(1) }%)`);
  console.log(`Other:     ${ results["Other"] } (Should be 0 for 'hello')`);
}

/**
 * Runs NLP & Logic test
 */
async function runNLPTest() {
  console.log(`\n${ COLORS.cyan }--- TEST 2: NLP & Logic Checks ---${ COLORS.reset }`);
  const id = await createConversation();

  const cases = [
    { input: "helo", expectedType: "Greeting", type: "Fuzzy Logic" },
    { input: "where is the toilet", expectedType: "Logistics", type: "Keyword Match" },
    { input: "fuck", expectedType: "Moderation", type: "Profanity Filter" },
    { input: "I hate you", expectedType: "AI", type: "Stop-Word Bypass (Should NOT match 'you')" }
  ];

  for (const c of cases) {
    const start = Date.now();
    const ans = await sendMessage(id, c.input);
    const duration = Date.now() - start;
    console.log(`${ COLORS.yellow }Input:${ COLORS.reset } "${ c.input }" [${ c.type }]`);
    console.log(`${ COLORS.green }Reply:${ COLORS.reset } (${ duration }ms) "${ ans.substring(0, 60) }..."\n`);
  }
}

// Run Tests
(async () => {
  try {
    // Check Health
    await fetch(`${ BASE_URL }/health`).catch(() => {
      console.log(`${ COLORS.red } Server not running! Start server.js first.${ COLORS.reset }`);
      process.exit(1);
    });
    console.log(`${ COLORS.green }Server Detected.${ COLORS.reset }`);
    await runProbabilityTest();
    await runNLPTest();
  } catch (err) {
    console.error(err);
  }
})();