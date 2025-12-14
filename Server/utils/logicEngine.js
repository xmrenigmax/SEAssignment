/**
 * @file utils/logicEngine.js
 * @description Logic engine that fetches rules from MongoDB instead of a local JSON file.
 */

import natural from 'natural';
import { Script } from '../models/Conversations.js';

// NLP Tools
const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;
const IGNORED_WORDS = new Set(['the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'to', 'of', 'in', 'it', 'you', 'i']);
const MIN_FUZZY_LENGTH = 3;
const FUZZY_THRESHOLD = 0.85; // Added missing threshold constant

// Cache the script in memory so we don't hit the DB on every single message
let cachedScript = null;

/**
 * Loads the script from MongoDB into memory.
 */
export async function loadScript() {
  try {
    // Fetch the document with configId 'main_config'
    const scriptDoc = await Script.findOne({ configId: 'main_config' });

    if (scriptDoc) {
      cachedScript = scriptDoc;
      console.log('[Logic Engine] Rules loaded from MongoDB.');
    } else {
      console.warn('[Logic Engine] No script found in DB. Using defaults.');
      cachedScript = { rules: [], general_responses: [] };
    }
  } catch (error) {
    console.error('[Logic Engine] DB Error:', error);
    cachedScript = { rules: [], general_responses: [] };
  }
}

/**
 * Normalizes probabilities and picks a response.
 * @param {Array} pool - Array of response objects
 */
function robustRandomSelect(pool) {
  if (!pool || pool.length === 0) return null;
  const totalWeight = pool.reduce((sum, item) => sum + (item.probability || 0), 0);
  let randomPoint = Math.random() * totalWeight;

  for (const option of pool) {
    const weight = option.probability || 0;
    if (randomPoint < weight) return option.response;
    randomPoint -= weight;
  }
  return pool[0].response;
}

/**
 * Checks text against loaded rules.
 * @param {string} input - User message
 */
export function checkScriptedResponse(input) {
  if (!cachedScript || !cachedScript.rules) return null;

  const inputLower = input.toLowerCase().trim();
  const inputTokens = tokenizer.tokenize(inputLower);
  const importantTokens = inputTokens.filter(t => !IGNORED_WORDS.has(t));
  const importantStems = importantTokens.map(t => stemmer.stem(t));

  for (const rule of cachedScript.rules) {
    const matchFound = rule.keywords.some(keyword => {
      const keywordLower = keyword.toLowerCase();

      // Phrase match
      if (keywordLower.includes(' ')) return inputLower.includes(keywordLower);
      if (IGNORED_WORDS.has(keywordLower)) return false;

      // Stem match
      const keywordStem = stemmer.stem(keywordLower);
      if (importantStems.includes(keywordStem)) return true;

      // Fuzzy Match (Handle typos, but only for longer words)
      if (keywordLower.length >= MIN_FUZZY_LENGTH) {
        return importantTokens.some(token => {
          // Check length
          if (token.length < MIN_FUZZY_LENGTH) return false;
          const similarity = natural.JaroWinklerDistance(token, keywordLower);
          return similarity >= FUZZY_THRESHOLD;
        });
      }
      return false;
    });

    // Matches
    if (matchFound) {
      console.log(`⚡ [Logic Engine] Matched Rule: ${rule.id}`);
      return robustRandomSelect(rule.response_pool);
    }
  }
  return null;
}

export function getFallback() {
  if (!cachedScript || !cachedScript.general_responses) return "The mind must remain firm.";
  return robustRandomSelect(cachedScript.general_responses);
}