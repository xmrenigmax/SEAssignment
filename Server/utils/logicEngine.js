import fs from 'fs/promises';
import { join } from 'path';

/**
 * @typedef {Object} LogicRule
 * @property {string} id - Unique identifier for the rule
 * @property {string[]} keywords - Array of keywords to match
 * @property {string} response - The static response text
 */

/**
 * @typedef {Object} ScriptData
 * @property {string} persona - The name of the persona
 * @property {string[]} fallbacks - Array of fallback messages
 * @property {LogicRule[]} rules - Array of logic rules
 */

let scriptData = null;

/**
 * Loads the JSON script from the filesystem.
 * @param {string} filePath - Path to the script.json file.
 * @returns {Promise<void>}
 */
export async function loadScript(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    scriptData = JSON.parse(data);
    console.log('✅ JSON Logic Engine Loaded');
  } catch (error) {
    console.error('❌ Error loading JSON script:', error);
    // Initialize with safe defaults if file fails
    scriptData = { rules: [], fallbacks: ["Logic not loaded."] };
  }
}

/**
 * Checks if the user input matches any defined keyword rules in the JSON.
 * This satisfies FR5 (JSON Scripting) and FR7 (Modern Tech Filtering).
 * * @param {string} input - The user's raw message.
 * @returns {string|null} - Returns the scripted response or null if no match found.
 */
export function checkScriptedResponse(input) {
  if (!scriptData) return null;

  const normalizedInput = input.toLowerCase();

  // Iterate through rules to find a keyword match
  for (const rule of scriptData.rules) {
    const hasMatch = rule.keywords.some(keyword => 
      normalizedInput.includes(keyword.toLowerCase())
    );

    if (hasMatch) {
      return rule.response;
    }
  }

  return null;
}

/**
 * Returns a random fallback message from the JSON script.
 * @returns {string} A random fallback string.
 */
export function getFallback() {
    if (!scriptData || !scriptData.fallbacks) return "Reflect within.";
    const index = Math.floor(Math.random() * scriptData.fallbacks.length);
    return scriptData.fallbacks[index];
}