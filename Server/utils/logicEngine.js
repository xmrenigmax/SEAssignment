/**
 * @file logicEngine.js
 * @description Core logic for loading and matching script rules.
 * Features NLP (Stemming & Fuzzy Matching) and robust probability weighting.
 * @author Group 1
 */

import fs from 'fs/promises';
import natural from 'natural';

// Initialize NLP tools
const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;

/**
 * @typedef {Object} ResponseOption
 * @property {number} probability - The likelihood of this response (0.0 - 1.0).
 * @property {string} response - The text content.
 */

let scriptData = null;

export async function loadScript(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    scriptData = JSON.parse(data);
    console.log('JSON Logic Engine Loaded (with NLP)');
  } catch (error) {
    console.error('Error loading JSON script:', error);
    scriptData = { rules: [], general_responses: [] };
  }
}

/**
 * robustRandomSelect
 * Normalizes probabilities to ensure they sum to 1, then picks based on weight.
 * Fixes the "always getting the same answer" bug.
 */
function robustRandomSelect(pool) {
  if (!pool || pool.length === 0) return null;

  // 1. Calculate total weight (in case json doesn't sum to 1.0)
  const totalWeight = pool.reduce((sum, item) => sum + (item.probability || 0), 0);

  // 2. Generate random point within that weight
  let randomPoint = Math.random() * totalWeight;

  // 3. Iterate and subtract until we hit the bracket
  for (const option of pool) {
    const weight = option.probability || 0;
    if (randomPoint < weight) {
      return option.response;
    }
    randomPoint -= weight;
  }

  // Fallback (mathematical edge case)
  return pool[0].response;
}

/**
 * Checks if input matches rules using NLP (Stemming + Fuzzy Match).
 * @param {string} input - User message
 */
export function checkScriptedResponse(input) {
  if (!scriptData || !scriptData.rules) return null;
  // Tokenize and Stem the user input
  const inputTokens = tokenizer.tokenize(input.toLowerCase());
  const inputStems = inputTokens.map(t => stemmer.stem(t));
  for (const rule of scriptData.rules) {
    const matchFound = rule.keywords.some(keyword => {
      const keywordLower = keyword.toLowerCase();
      // Direct Stem Match
      const keywordStem = stemmer.stem(keywordLower);
      if (inputStems.includes(keywordStem)) return true;
      // Fuzzy Match
      return inputTokens.some(token => {
        const similarity = natural.JaroWinklerDistance(token, keywordLower);
        return similarity > 0.85;
      });
    });
    if (matchFound) {
      console.log(`[Logic Engine] NLP Match found for rule: ${rule.id}`);
      return robustRandomSelect(rule.response_pool);
    }
  }

  return null;
}

export function getFallback() {
  if (!scriptData || !scriptData.general_responses) {
    return "The mind must remain firm.";
  }
  return robustRandomSelect(scriptData.general_responses);
}