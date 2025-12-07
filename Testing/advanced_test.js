/**
 * @file advanced_test.js
 * @description Advanced Test Runner.
 * Runs high-volume probability, NLP, and Moderation tests with detailed reporting.
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api';
const  COLORS = { reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m"
};

async function createConversation() {
  const res = await fetch(`${ BASE_URL }/conversations`, { method: 'POST'  });
  const data = await res.json();
  return data.id;
}

async function sendMessage(id, text) {
  const res = await fetch(`${ BASE_URL }/conversations/${ id }/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json'  },
    body: JSON.stringify({ text  })
  });
  if (!res.ok) throw new Error(`HTTP ${ res.status }`);
  const data = await res.json();
  return data.marcusMessage.text;
}

async function runProbabilityTest() {
  console.log(`\n${ COLORS.cyan }--- TEST 1: Probability Distribution (200 Requests) ---${ COLORS.reset }`);
  const id = await createConversation();
  const results = { "Hail": 0, "Greetings": 0, "Other": 0  };
  const TOTAL = 200;

  process.stdout.write("Progress: ");
  for (let i = 0; i < TOTAL; i++) {
    try {
      const ans = await sendMessage(id, "hello");
      if (ans.includes("Hail")) results["Hail"]++;
      else if (ans.includes("Greetings")) results["Greetings"]++;
      else results["Other"]++;
      if (i % 10 === 0) process.stdout.write("|");
    } catch (e) {
      process.stdout.write("X");
    }
  }

  console.log(`\n\n${ COLORS.green }Results:${ COLORS.reset }`);
  console.log(`Hail: ${ results["Hail"] } (${ (results["Hail"]/TOTAL*100).toFixed(1) }%) - Expected ~40%`);
  console.log(`Greetings: ${ results["Greetings"] } (${ (results["Greetings"]/TOTAL*100).toFixed(1) }%) - Expected ~60%`);
}

async function runNLPTest() {
  console.log(`\n${ COLORS.cyan }--- TEST 2: NLP & Logic Checks ---${ COLORS.reset }`);
  const id = await createConversation();
  const cases = [
    { input: "helo", expected: "Greeting/Hail", type: "Fuzzy"  },
    { input: "i feel fear", expected: "Stoic Advice", type: "Stemming"  },
    { input: "what is it", expected: "Be more specific", type: "Vague Rule"  },
    { input: "fuck", expected: "Guard your senses", type: "Moderation"  }
  ];

  for (const c of cases) {
    const ans = await sendMessage(id, c.input);
    console.log(`${  COLORS.yellow  }Input:${  COLORS.reset  } "${ c.input  }" (${ c.type  })`);
    console.log(`${  COLORS.green  }Response:${  COLORS.reset  } ${ ans.substring(0, 60)  }...\n`);
  }
}

// Run Tests
(async () => {
  try {
    // Check Health
    await fetch(`${BASE_URL }/health`).catch(() => {
      console.log(`${  COLORS.red  } Server not running! Start server.js first.${  COLORS.reset  }`);
      process.exit(1);
    });
    await runProbabilityTest();
    await runNLPTest();
  } catch (err) {
    console.error(err);
  }
})();