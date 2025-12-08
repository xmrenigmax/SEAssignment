/**
 * @file logicEngine.js
 * @description Core logic for loading and matching script rules.
 * Added Stop-Word filtering and Phrase Matching to prevent false positives.
 */

import fs from 'fs/promises';
import natural from 'natural';

// Initialize NLP tools
const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;

// This prevents "I like you" from triggering a rule just because it has "you"
const IGNORED_WORDS = new Set([
  'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but',
  'to', 'of', 'in', 'it', 'that', 'you', 'your', 'me', 'my', 'i', 'we'
]);

// Prevents short words like "bat" matching "cat"
const MIN_FUZZY_LENGTH = 4;

// Similarity Threshold (0.85 is standard, 0.90 is stricter)
const FUZZY_THRESHOLD = 0.90;
let scriptData = null;

// Loads JSON Script into memory
export async function loadScript(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    scriptData = JSON.parse(data);
    console.log('Logic Engine Loaded (Robust NLP Active)');
  } catch (error) {
    console.error('Error loading JSON script:', error);
    scriptData = { rules: [], general_responses: [] };
  }
}

/**
 * Normalizes probabilities to ensure they sum to 1, then picks based on weight.
 */
function robustRandomSelect(pool) {
  if (!pool || pool.length === 0) return null;
  const totalWeight = pool.reduce((sum, item) => sum + (item.probability || 0), 0);
  let randomPoint = Math.random() * totalWeight;

  for (const option of pool) {
    const weight = option.probability || 0;
    if (randomPoint < weight) {
      return option.response;
    }
    randomPoint -= weight;
  }
  return pool[0].response;
}

/**
 * Checks if input matches rules using robust NLP.
 * Priority:
 */
export function checkScriptedResponse(input) {
  if (!scriptData || !scriptData.rules) return null;

  // Preprocess input
  const inputLower = input.toLowerCase().trim();
  const inputTokens = tokenizer.tokenize(inputLower);

  // Filter out stop words from the input for keyword analysis
  const importantTokens = inputTokens.filter(t => !IGNORED_WORDS.has(t));
  const importantStems = importantTokens.map(t => stemmer.stem(t));
  // Check each Rule
  for (const rule of scriptData.rules) {
    const matchFound = rule.keywords.some(keyword => {
      const keywordLower = keyword.toLowerCase();

      // If the keyword in JSON has spaces (e.g. "who are you"), check the FULL raw string.
      if (keywordLower.includes(' ')) {
        return inputLower.includes(keywordLower);
      }

      // If the keyword is a stop word (e.g. "you"), IGNORE it
      if (IGNORED_WORDS.has(keywordLower)) return false;

      const keywordStem = stemmer.stem(keywordLower);

      // Direct Stem Match (e.g. "walking" matches "walk")
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
      console.log(`⚡ [Logic Engine] Match found for rule: ${rule.id}`);
      return robustRandomSelect(rule.response_pool);
    }
  }
  return null;
}
// Returns fallback if no match
export function getFallback() {
  if (!scriptData || !scriptData.general_responses) {
    return "The mind must remain firm.";
  }
  return robustRandomSelect(scriptData.general_responses);
}