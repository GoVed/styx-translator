/**
 * Romanization engine for Cyrillic (Russian/Ukrainian/Bulgarian), Greek, and Arabic scripts.
 */

const CYRILLIC_MAP = {
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
  'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
  'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts',
  'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
};

const GREEK_MAP = {
  'α': 'a', 'β': 'v', 'γ': 'g', 'δ': 'd', 'ε': 'e', 'ζ': 'z', 'η': 'i', 'θ': 'th',
  'ι': 'i', 'κ': 'k', 'λ': 'l', 'μ': 'm', 'ν': 'n', 'ξ': 'x', 'ο': 'o', 'π': 'p',
  'ρ': 'r', 'σ': 's', 'ς': 's', 'τ': 't', 'υ': 'y', 'φ': 'f', 'χ': 'ch', 'ψ': 'ps', 'ω': 'o'
};

const ARABIC_MAP = {
  'ا': 'a', 'أ': 'a', 'إ': 'i', 'آ': 'aa', 'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j',
  'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'dh', 'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh',
  'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z', 'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ق': 'q',
  'ك': 'k', 'ل': 'l', 'م': 'm', 'ન': 'n', 'ن': 'n', 'ه': 'h', 'و': 'w', 'ي': 'y',
  'ى': 'a', 'ة': 'h', 'ء': "'"
};

/**
 * Transliterates Cyrillic text (Russian, Ukrainian, Bulgarian) to Latin script.
 * @param {string} text
 * @returns {string}
 */
export function romanizeCyrillic(text) {
  if (!text) return '';
  return text.split('').map(c => {
    const low = c.toLowerCase();
    const trans = CYRILLIC_MAP[low];
    if (!trans) return c;
    return c === low ? trans : trans.charAt(0).toUpperCase() + trans.slice(1);
  }).join('');
}

/**
 * Transliterates Modern Greek text to Greeklish (Latin alphabet).
 * @param {string} text
 * @returns {string}
 */
export function romanizeGreek(text) {
  if (!text) return '';
  // Normalize accented Greek vowels
  const normalized = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return normalized.split('').map(c => {
    const low = c.toLowerCase();
    const trans = GREEK_MAP[low];
    if (!trans) return c;
    return c === low ? trans : trans.charAt(0).toUpperCase() + trans.slice(1);
  }).join('');
}

/**
 * Transliterates Arabic text to Latin (Arabizi / Chat Arabic).
 * @param {string} text
 * @returns {string}
 */
export function romanizeArabic(text) {
  if (!text) return '';
  return text.split('').map(c => ARABIC_MAP[c] || c).join('');
}

export default { romanizeCyrillic, romanizeGreek, romanizeArabic };
