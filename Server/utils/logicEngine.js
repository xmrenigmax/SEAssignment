/**
 * @file utils/logicEngine.js
 * @description Logic engine that fetches rules from MongoDB instead of a local JSON file.
 * @author Group 1
 */

import natural from 'natural';
import { Script } from '../models/Conversations.js';
import { findSemanticMatch, precomputeKeywordEmbeddings } from './semanticEngine.js';

// NLP Tools
const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;
const IGNORED_WORDS = new Set(['the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'to', 'of', 'in', 'it', 'you', 'i']);
const MIN_FUZZY_LENGTH = 3;
const FUZZY_THRESHOLD = 0.85;

// Cache the script in memory so we don't hit the DB on every single message
let cachedScript = null;

/**
 * @function loadScript
 * @description Loads the script from MongoDB into memory.
 */
export async function loadScript() {
  try {
    // Fetch the document with configId 'main_config'
    const scriptDoc = await Script.findOne({ configId: 'main_config' });

    if (scriptDoc) {
      cachedScript = scriptDoc;
      console.log('[Logic Engine] Rules loaded from MongoDB.');

      try {
        await precomputeKeywordEmbeddings(scriptDoc.rules || []);
      } catch (error) {
        console.warn('[Logic Engine] Semantic precomputation failed, keyword matching only:', error.message);
      }
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
 * @function robustRandomSelect
 * @description Normalizes probabilities and picks a response.
 * @param {Array} pool - Array of response objects.
 * @returns {string} The selected response text.
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
 * @function checkScriptedResponse
 * @description Checks text against loaded rules.
 * @param {string} input - User message.
 * @returns {string|null} The scripted response or null if no match.
 */
export async function checkScriptedResponse(input) {
  if (!cachedScript) {
    console.log('[Logic Engine] Script missing from cache. Loading now...');
    await loadScript();
  }
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
      // Jaro-Winkler scores 0-1 based on character similarity and position
      // Example: "stoic" vs "stoick" = 0.97 (match), "stoic" vs "happy" = 0.4 (no match)
      // MIN_FUZZY_LENGTH prevents false positives on short words like "is" vs "it"
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
      console.log(`⚡ [Logic Engine] Keyword Match: ${rule.id}`);
      return robustRandomSelect(rule.response_pool);
    }
  }
  return null;
}

/**
 * HYBRID APPROACH: Try multiple methods to find best response
 * @param {string} input - User message
 * @returns {Promise<string|null>} - Response or null if no match
 */
export async function getHybridResponse(input) {
  // STEP 1: Try exact keyword matching (fastest)
  // This catches common queries like "hello" or "what is stoicism" in <5ms
  const keywordMatch = checkScriptedResponse(input);
  if (keywordMatch) {
    return keywordMatch;
  }

  // STEP 2: Try semantic similarity (slower but smarter)
  // This catches paraphrased queries like "tell me about staying calm" → "stoic mindset"
  // Takes ~20ms but understands intent, not just keywords
  try {
    const semanticMatch = await findSemanticMatch(input, 0.65); // 65% similarity threshold
    if (semanticMatch) {
      const rule = cachedScript.rules.find(r => r.id === semanticMatch.ruleId);
      if (rule && rule.response_pool) {
        return robustRandomSelect(rule.response_pool);
      }
    }
  } catch (error) {
    console.error('[Logic Engine] Semantic matching failed:', error);
  }

  // No match found, return null (will trigger LLM in server.js)
  return null;
}

export function getFallback() {
  if (!cachedScript || !cachedScript.general_responses) return "The mind must remain firm.";
  return robustRandomSelect(cachedScript.general_responses);
}