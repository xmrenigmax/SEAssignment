/**
 * @file utils/semanticEngine.js
 * @description Semantic similarity matching using transformer embeddings
 * Converts text to vectors and compares semantic meaning instead of keywords
 */

import { pipeline } from '@xenova/transformers';

let embeddingPipeline = null;
const embeddingCache = new Map();

export async function initializeSemanticEngine() {
  try {
    console.log('[Semantic Engine] Loading embedding model...');
    // all-MiniLM-L6-v2 is small (22MB), fast, and accurate for semantic search
    embeddingPipeline = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2'
    );
    console.log('[Semantic Engine] ✓ Model loaded successfully');
  } catch (error) {
    console.error('[Semantic Engine] Failed to load model:', error);
    throw error;
  }
}

/**
 * Generate embedding vector for a piece of text
 * @param {string} text - Input text
 * @returns {Promise<Array<number>>} - 384-dimensional vector
 */
export async function getEmbedding(text) {
  if (!embeddingPipeline) {
    throw new Error('[Semantic Engine] Model not initialized. Call initializeSemanticEngine() first.');
  }

  try {
    const output = await embeddingPipeline(text, {
      pooling: 'mean',
      normalize: true
    });

    return Array.from(output.data);
  } catch (error) {
    console.error('[Semantic Engine] Embedding generation failed:', error);
    return null;
  }
}

/**
 * Calculate cosine similarity between two normalized vectors
 * @param {Array<number>} vecA - First vector
 * @param {Array<number>} vecB - Second vector
 * @returns {number} - Similarity score (0-1, higher = more similar)
 */
export function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) {
    return 0;
  }

  // Since vectors are normalized, dot product = cosine similarity
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  return dotProduct;
}

/**
 * Pre-compute embeddings for all keywords in rules
 * This happens once at startup to make runtime matching fast
 * @param {Array} rules - Array of rule objects with keywords
 */
export async function precomputeKeywordEmbeddings(rules) {
  if (!embeddingPipeline) {
    console.warn('[Semantic Engine] Model not ready. Skipping precomputation.');
    return;
  }

  console.log('[Semantic Engine] Pre-computing keyword embeddings...');
  let computedCount = 0;

  for (const rule of rules) {
    if (!rule.keywords || !Array.isArray(rule.keywords)) continue;

    for (const keyword of rule.keywords) {
      if (embeddingCache.has(keyword)) continue;

      try {
        const embedding = await getEmbedding(keyword);
        if (embedding) {
          embeddingCache.set(keyword, {
            ruleId: rule.id,
            vector: embedding,
            text: keyword
          });
          computedCount++;
        }
      } catch (error) {
        console.error(`[Semantic Engine] Failed to embed keyword "${keyword}":`, error);
      }
    }
  }

  console.log(`[Semantic Engine] ✓ Pre-computed ${computedCount} keyword embeddings`);
}

/**
 * Find best semantic match for user input
 * @param {string} input - User message
 * @param {number} threshold - Minimum similarity score (default: 0.65)
 * @returns {Promise<Object|null>} - {ruleId, similarity, matchedKeyword} or null
 */
export async function findSemanticMatch(input, threshold = 0.65) {
  if (!embeddingPipeline) {
    return null;
  }

  try {
    const inputEmbedding = await getEmbedding(input);
    if (!inputEmbedding) return null;

    let bestMatch = null;
    let bestScore = threshold;

    for (const [keyword, cached] of embeddingCache.entries()) {
      const similarity = cosineSimilarity(inputEmbedding, cached.vector);

      if (similarity > bestScore) {
        bestScore = similarity;
        bestMatch = {
          ruleId: cached.ruleId,
          similarity: similarity,
          matchedKeyword: keyword
        };
      }
    }

    if (bestMatch) {
      console.log(`🧠 [Semantic Engine] Match found: "${bestMatch.matchedKeyword}" (${(bestMatch.similarity * 100).toFixed(1)}% similar) → ${bestMatch.ruleId}`);
    }

    return bestMatch;
  } catch (error) {
    console.error('[Semantic Engine] Matching failed:', error);
    return null;
  }
}

/**
 * Get statistics about the semantic engine
 * @returns {Object} - Stats object
 */
export function getSemanticEngineStats() {
  return {
    modelLoaded: embeddingPipeline !== null,
    cachedEmbeddings: embeddingCache.size,
    modelName: 'Xenova/all-MiniLM-L6-v2'
  };
}
