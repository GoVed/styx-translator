/**
 * Phonetic transliteration for all Indic Brahmic scripts to Latin text (Gujlish, Hinglish, Banglish, etc.).
 * Leverages the unified Unicode block alignment across South Asian scripts (0x0900 - 0x0D7F).
 */

const BRAHMIC_INDEPENDENT_VOWELS = {
  5: 'a', 6: 'aa', 7: 'i', 8: 'ee', 9: 'u', 10: 'oo', 11: 'ri',
  14: 'e', 15: 'e', 16: 'ai', 18: 'o', 19: 'o', 20: 'au'
};

const BRAHMIC_CONSONANTS = {
  21: 'k', 22: 'kh', 23: 'g', 24: 'gh', 25: 'ng',
  26: 'ch', 27: 'chh', 28: 'j', 29: 'jh', 30: 'ny',
  31: 't', 32: 'th', 33: 'd', 34: 'dh', 35: 'n',
  36: 't', 37: 'th', 38: 'd', 39: 'dh', 40: 'n',
  42: 'p', 43: 'ph', 44: 'b', 45: 'bh', 46: 'm',
  47: 'y', 48: 'r', 49: 'r', 50: 'l', 51: 'l', 52: 'l', 53: 'v',
  54: 'sh', 55: 'sh', 56: 's', 57: 'h'
};

const BRAHMIC_MATRAS = {
  62: 'a', 63: 'i', 64: 'i', 65: 'u', 66: 'u', 67: 'ri',
  70: 'e', 71: 'e', 72: 'ai', 74: 'o', 75: 'o', 76: 'au'
};

/**
 * Transliterates any Brahmic script text (Devanagari, Gujarati, Bengali, Gurmukhi, Tamil, Telugu, Kannada, Malayalam).
 * @param {string} text
 * @returns {string}
 */
export function transliterateBrahmic(text) {
  if (!text) return '';
  let out = '';

  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);

    // Brahmic script blocks: 0x0900 - 0x0D7F
    if (code >= 0x0900 && code <= 0x0D7F) {
      const blockStart = code & ~0x7F;
      const offset = code - blockStart;
      const nextCode = text.charCodeAt(i + 1);
      const nextBlockStart = nextCode & ~0x7F;
      const nextOffset = (nextBlockStart === blockStart) ? (nextCode - nextBlockStart) : -1;

      if (offset === 77) { // virama / halant (suppress inherent vowel)
        continue;
      }
      if (offset === 2) { // anusvara
        out += 'n';
        continue;
      }
      if (offset === 3) { // visarga
        out += 'h';
        continue;
      }
      if (BRAHMIC_MATRAS[offset]) {
        out += BRAHMIC_MATRAS[offset];
        continue;
      }
      if (BRAHMIC_INDEPENDENT_VOWELS[offset]) {
        out += BRAHMIC_INDEPENDENT_VOWELS[offset];
        continue;
      }
      if (BRAHMIC_CONSONANTS[offset]) {
        out += BRAHMIC_CONSONANTS[offset];
        if (nextOffset === 77) { // virama follows
          i++;
        } else if (BRAHMIC_MATRAS[nextOffset]) {
          out += BRAHMIC_MATRAS[nextOffset];
          i++;
        } else if (nextOffset >= 21 && nextOffset <= 57) {
          out += 'a';
        } else if (i === text.length - 1 || /[\s\p{P}]/u.test(text[i + 1])) {
          // Schwa deletion at word ending
        } else {
          out += 'a';
        }
        continue;
      }
    }

    if (code === 0x0964 || code === 0x0965) { // Danda (।) -> period
      out += '.';
      continue;
    }

    out += text[i];
  }

  return out;
}

/**
 * Transliterates Gujarati to conversational Gujlish.
 * @param {string} text
 * @returns {string}
 */
export function gujaratiToGujlish(text) {
  if (!text) return '';
  return transliterateBrahmic(text)
    .replace(/\bche\b/gi, 'chhe')
    .replace(/\bthee\b/gi, 'thi')
    .replace(/\bpan\b/gi, 'pan')
    .replace(/\bne\b/gi, 'ne')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Transliterates Devanagari to conversational Hinglish.
 * @param {string} text
 * @returns {string}
 */
export function devanagariToHinglish(text) {
  if (!text) return '';
  return transliterateBrahmic(text)
    .replace(/\bhai\b/gi, 'hai')
    .replace(/\bhain\b/gi, 'hain')
    .replace(/\bkya\b/gi, 'kya')
    .replace(/\baapake\b/gi, 'aapke')
    .replace(/\baapaka\b/gi, 'aapka')
    .replace(/\baapaki\b/gi, 'aapki')
    .replace(/\blie\b/gi, 'liye')
    .replace(/\byah\b/gi, 'yeh')
    .replace(/\bsope\b/gi, 'saral')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Transliterates Bengali to conversational Banglish.
 * @param {string} text
 * @returns {string}
 */
export function bengaliToBanglish(text) {
  if (!text) return '';
  return transliterateBrahmic(text)
    .replace(/\baami\b/gi, 'ami')
    .replace(/\bapnake\b/gi, 'apnake')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Transliterates South Indian languages (Telugu, Tamil, Kannada, Malayalam).
 * @param {string} text
 * @returns {string}
 */
export function dravidianToLatin(text) {
  if (!text) return '';
  return transliterateBrahmic(text)
    .replace(/\s+/g, ' ')
    .trim();
}

export default {
  transliterateBrahmic,
  gujaratiToGujlish,
  devanagariToHinglish,
  bengaliToBanglish,
  dravidianToLatin
};
