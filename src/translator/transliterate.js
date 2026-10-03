/**
 * Phonetic transliteration engine for Indic scripts to Romanized Latin text (Gujlish & Hinglish).
 */

const GUJARATI_CONSONANTS = {
  '\u0A95': 'k', '\u0A96': 'kh', '\u0A97': 'g', '\u0A98': 'gh', '\u0A99': 'ng',
  '\u0A9A': 'ch', '\u0A9B': 'chh', '\u0A9C': 'j', '\u0A9D': 'z', '\u0A9E': 'ny',
  '\u0A9F': 't', '\u0AA0': 'th', '\u0AA1': 'd', '\u0AA2': 'dh', '\u0AA3': 'n',
  '\u0AA4': 't', '\u0AA5': 'th', '\u0AA6': 'd', '\u0AA7': 'dh', '\u0AA8': 'n',
  '\u0AAA': 'p', '\u0AAB': 'f', '\u0AAC': 'b', '\u0AAD': 'bh', '\u0AAE': 'm',
  '\u0AAF': 'y', '\u0AB0': 'r', '\u0AB2': 'l', '\u0AB3': 'l', '\u0AB5': 'v',
  '\u0AB6': 'sh', '\u0AB7': 'sh', '\u0AB8': 's', '\u0AB9': 'h'
};

const GUJARATI_VOWELS = {
  '\u0A85': 'a', '\u0A86': 'aa', '\u0A87': 'i', '\u0A88': 'ee', '\u0A89': 'u',
  '\u0A8A': 'oo', '\u0A8B': 'ri', '\u0A8F': 'e', '\u0A90': 'ai', '\u0A91': 'o',
  '\u0A93': 'o', '\u0A94': 'au'
};

const GUJARATI_MATRAS = {
  '\u0ABE': 'a', '\u0ABF': 'i', '\u0AC0': 'i', '\u0AC1': 'u', '\u0AC2': 'u',
  '\u0AC3': 'ri', '\u0AC5': 'e', '\u0AC7': 'e', '\u0AC8': 'ai', '\u0AC9': 'o',
  '\u0ACB': 'o', '\u0ACC': 'au'
};

const DEVANAGARI_CONSONANTS = {
  '\u0915': 'k', '\u0916': 'kh', '\u0917': 'g', '\u0918': 'gh', '\u0919': 'ng',
  '\u091A': 'ch', '\u091B': 'chh', '\u091C': 'j', '\u091D': 'jh', '\u091E': 'ny',
  '\u091F': 't', '\u0920': 'th', '\u0921': 'd', '\u0922': 'dh', '\u0923': 'n',
  '\u0924': 't', '\u0925': 'th', '\u0926': 'd', '\u0927': 'dh', '\u0928': 'n',
  '\u092A': 'p', '\u092B': 'f', '\u092C': 'b', '\u092D': 'bh', '\u092E': 'm',
  '\u092F': 'y', '\u0930': 'r', '\u0932': 'l', '\u0933': 'l', '\u0935': 'v',
  '\u0936': 'sh', '\u0937': 'sh', '\u0938': 's', '\u0939': 'h'
};

const DEVANAGARI_VOWELS = {
  '\u0905': 'a', '\u0906': 'aa', '\u0907': 'i', '\u0908': 'ee', '\u0909': 'u',
  '\u090A': 'oo', '\u090B': 'ri', '\u090F': 'e', '\u0910': 'ai', '\u0911': 'o',
  '\u0913': 'o', '\u0914': 'au'
};

const DEVANAGARI_MATRAS = {
  '\u093E': 'a', '\u093F': 'i', '\u0940': 'i', '\u0941': 'u', '\u0942': 'u',
  '\u0943': 'ri', '\u0945': 'e', '\u0947': 'e', '\u0948': 'ai', '\u0949': 'o',
  '\u094B': 'o', '\u094C': 'au'
};

/**
 * Transliterates Gujarati script to conversational Gujlish (Latin alphabet).
 * @param {string} text
 * @returns {string}
 */
export function gujaratiToGujlish(text) {
  if (!text) return '';
  const virama = '\u0ACD';
  const anusvara = '\u0A82';
  const visarga = '\u0A83';

  let out = '';
  const chars = Array.from(text);
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    const next = chars[i + 1];

    if (GUJARATI_VOWELS[c]) {
      out += GUJARATI_VOWELS[c];
    } else if (GUJARATI_CONSONANTS[c]) {
      out += GUJARATI_CONSONANTS[c];
      if (next === virama) {
        i++;
      } else if (GUJARATI_MATRAS[next]) {
        out += GUJARATI_MATRAS[next];
        i++;
      } else if (next && (GUJARATI_CONSONANTS[next] || GUJARATI_VOWELS[next])) {
        out += 'a';
      } else if (!next || /[\s\p{P}]/u.test(next)) {
        // Schwa deletion at word ending
      } else {
        out += 'a';
      }
    } else if (c === anusvara) {
      out += 'n';
    } else if (c === visarga) {
      out += 'h';
    } else {
      out += c;
    }
  }

  // Idiomatic conversational corrections
  return out
    .replace(/\bche\b/gi, 'chhe')
    .replace(/\bthee\b/gi, 'thi')
    .replace(/\bpan\b/gi, 'pan')
    .replace(/\bne\b/gi, 'ne')
    .trim();
}

/**
 * Transliterates Devanagari script to conversational Hinglish (Latin alphabet).
 * @param {string} text
 * @returns {string}
 */
export function devanagariToHinglish(text) {
  if (!text) return '';
  const virama = '\u094D';
  const anusvara = '\u0902';
  const visarga = '\u0903';

  let out = '';
  const chars = Array.from(text);
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    const next = chars[i + 1];

    if (DEVANAGARI_VOWELS[c]) {
      out += DEVANAGARI_VOWELS[c];
    } else if (DEVANAGARI_CONSONANTS[c]) {
      out += DEVANAGARI_CONSONANTS[c];
      if (next === virama) {
        i++;
      } else if (DEVANAGARI_MATRAS[next]) {
        out += DEVANAGARI_MATRAS[next];
        i++;
      } else if (next && (DEVANAGARI_CONSONANTS[next] || DEVANAGARI_VOWELS[next])) {
        out += 'a';
      } else if (!next || /[\s\p{P}]/u.test(next)) {
        // Schwa deletion at word ending
      } else {
        out += 'a';
      }
    } else if (c === anusvara) {
      out += 'n';
    } else if (c === visarga) {
      out += 'h';
    } else {
      out += c;
    }
  }
  return out
    .replace(/।/g, '.')
    .replace(/\bhai\b/gi, 'hai')
    .replace(/\bhain\b/gi, 'hain')
    .replace(/\bkya\b/gi, 'kya')
    .replace(/\baapake\b/gi, 'aapke')
    .replace(/\baapaka\b/gi, 'aapka')
    .replace(/\baapaki\b/gi, 'aapki')
    .replace(/\blie\b/gi, 'liye')
    .replace(/\byah\b/gi, 'yeh')
    .replace(/\bsope\b/gi, 'saral')
    .trim();
}

export default { gujaratiToGujlish, devanagariToHinglish };
