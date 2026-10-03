import fs from 'node:fs';
import config from '../config.js';
import logger from '../utils/logger.js';

let cachedGlossary = null;
let lastMtime = 0;

/**
 * Normalizes input text for phrase/term lookup.
 * @param {string} text
 * @returns {string}
 */
export function normalize(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[?!.,;:_~'"()[\]{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Loads and caches user-configured glossary file for domain terminology overrides.
 */
export function loadGlossary() {
  try {
    if (fs.existsSync(config.glossaryPath)) {
      const stats = fs.statSync(config.glossaryPath);
      if (!cachedGlossary || stats.mtimeMs > lastMtime) {
        const raw = fs.readFileSync(config.glossaryPath, 'utf-8');
        cachedGlossary = JSON.parse(raw);
        lastMtime = stats.mtimeMs;
        logger.debug({ path: config.glossaryPath }, 'Loaded custom translation glossary');
      }
      return cachedGlossary;
    }
  } catch (err) {
    logger.warn({ err: err.message }, 'Failed to load glossary file');
  }

  return { phrases: [], terms: {} };
}

export default { normalize, loadGlossary };
