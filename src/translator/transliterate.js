/**
 * Master multi-language transliteration registry and dispatcher.
 * Supports all global languages and dialects commonly written in Latin script.
 */

import {
  transliterateBrahmic,
  gujaratiToGujlish,
  devanagariToHinglish,
  bengaliToBanglish,
  dravidianToLatin
} from './transliterate/indic.js';

import { romanizeHangul, romanizeKana } from './transliterate/east_asian.js';
import { romanizeCyrillic, romanizeGreek, romanizeArabic } from './transliterate/mediterranean.js';

/**
 * Mapping of colloquial Latin dialect identifiers to their core native language.
 */
export const DIALECT_TO_CORE_LANG = {
  gujlish: 'gujarati',
  hinglish: 'hindi',
  banglish: 'bengali',
  tenglish: 'telugu',
  tanglish: 'tamil',
  kanglish: 'kannada',
  manglish: 'malayalam',
  marathlish: 'marathi',
  punjlish: 'punjabi',
  romaji: 'japanese',
  korean_latin: 'korean',
  hangul_latin: 'korean',
  greeklish: 'greek',
  arabizi: 'arabic',
  chat_arabic: 'arabic',
  cyrillic_latin: 'russian',
  russian_latin: 'russian',
  translit: 'russian'
};

/**
 * Checks whether a given language identifier is a recognized Romanized dialect.
 * @param {string} lang
 * @returns {boolean}
 */
export function isRomanizedDialect(lang) {
  if (!lang) return false;
  const normalized = lang.toLowerCase().trim();
  return Boolean(DIALECT_TO_CORE_LANG[normalized]);
}

/**
 * Transliterates text from its native script into conversational Latin script.
 * @param {string} text
 * @param {string} [targetLang='']
 * @returns {string}
 */
export function transliterateText(text, targetLang = '') {
  if (!text) return '';
  const target = (targetLang || '').toLowerCase().trim();

  // Explicit dialect requests
  if (target === 'gujlish' || /[\u0A80-\u0AFF]/.test(text)) {
    return gujaratiToGujlish(text);
  }
  if (target === 'hinglish' || target === 'marathlish' || /[\u0900-\u097F]/.test(text)) {
    return devanagariToHinglish(text);
  }
  if (target === 'banglish' || /[\u0980-\u09FF]/.test(text)) {
    return bengaliToBanglish(text);
  }
  if (target === 'tenglish' || target === 'tanglish' || target === 'kanglish' || target === 'manglish'
      || /[\u0B80-\u0D7F]/.test(text)) {
    return dravidianToLatin(text);
  }
  if (target === 'romaji' || /[\u3040-\u30FF]/.test(text)) {
    return romanizeKana(text);
  }
  if (target === 'korean_latin' || target === 'hangul_latin' || /[\uAC00-\uD7AF]/.test(text)) {
    return romanizeHangul(text);
  }
  if (target === 'cyrillic_latin' || target === 'translit' || target === 'russian_latin'
      || /[\u0400-\u04FF]/.test(text)) {
    return romanizeCyrillic(text);
  }
  if (target === 'greeklish' || /[\u0370-\u03FF]/.test(text)) {
    return romanizeGreek(text);
  }
  if (target === 'arabizi' || target === 'chat_arabic' || /[\u0600-\u06FF]/.test(text)) {
    return romanizeArabic(text);
  }

  // Fallback: check Brahmic generic
  if (/[\u0900-\u0D7F]/.test(text)) {
    return transliterateBrahmic(text);
  }

  return text;
}

export {
  transliterateBrahmic,
  gujaratiToGujlish,
  devanagariToHinglish,
  bengaliToBanglish,
  dravidianToLatin,
  romanizeHangul,
  romanizeKana,
  romanizeCyrillic,
  romanizeGreek,
  romanizeArabic
};

export default {
  transliterateText,
  isRomanizedDialect,
  DIALECT_TO_CORE_LANG,
  gujaratiToGujlish,
  devanagariToHinglish,
  bengaliToBanglish,
  dravidianToLatin,
  romanizeHangul,
  romanizeKana,
  romanizeCyrillic,
  romanizeGreek,
  romanizeArabic
};
