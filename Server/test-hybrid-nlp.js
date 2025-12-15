/**
 * @file test-hybrid-nlp.js
 * @description Test the hybrid NLP system
 */

import { initializeSemanticEngine, getEmbedding, findSemanticMatch, precomputeKeywordEmbeddings } from './utils/semanticEngine.js';
import { getHybridResponse, loadScript } from './utils/logicEngine.js';
import connectToDatabase from './utils/db.js';
import dotenv from 'dotenv';

dotenv.config();

async function runTests() {
  console.log('Testing Hybrid NLP System\n');
  console.log('='.repeat(50));

  // Initialize
  console.log('\nInitializing system...');
  await connectToDatabase();
  await initializeSemanticEngine();
  await loadScript();

  // Test cases
  const testCases = [
    // Exact keyword match (should be FAST ~5ms)
    { input: "where is the bathroom?", expectedSpeed: "FAST (keyword)" },

    // Semantic match (slightly different wording, ~60-210ms)
    { input: "I need to find the restroom", expectedSpeed: "MEDIUM (semantic)" },
    { input: "where can I go to pee?", expectedSpeed: "MEDIUM (semantic)" },

    // Semantic match with typos
    { input: "were is the bathrom?", expectedSpeed: "MEDIUM (semantic/fuzzy)" },

    // Different phrasing (should still match semantically)
    { input: "looking for the toilet facilities", expectedSpeed: "MEDIUM (semantic)" },

    // No match (will fallback to LLM or general response)
    { input: "what is the meaning of life?", expectedSpeed: "SLOW (LLM fallback)" }
  ];

  console.log('\nRunning test queries...\n');

  for (const test of testCases) {
    console.log(`\nQuery: "${ test.input }"`);
    console.log(`   Expected: ${ test.expectedSpeed }`);

    const startTime = Date.now();
    const response = await getHybridResponse(test.input);
    const endTime = Date.now();

    console.log(`   Time: ${ endTime - startTime }ms`);
    console.log(`   Response: ${ response ? response.substring(0, 80) + '...' : 'null (will use LLM)' }`);
    console.log('-'.repeat(50));
  }

  console.log('\nTest complete!\n');
  process.exit(0);
}

runTests().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
