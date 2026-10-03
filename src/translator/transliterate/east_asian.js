/**
 * Romanization engine for East Asian scripts (Japanese Kana -> Romaji, Korean Hangul -> Revised Romanization).
 */

const HANGUL_INITIALS = ['g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp', 's', 'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h'];
const HANGUL_VOWELS = ['a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o', 'wa', 'wae', 'oe', 'yo', 'u', 'wo', 'we', 'wi', 'yu', 'eu', 'ui', 'i'];
const HANGUL_FINALS = ['', 'k', 'k', 'ks', 'n', 'nj', 'nh', 'd', 'l', 'lg', 'lm', 'lb', 'ls', 'lt', 'lp', 'lh', 'm', 'b', 'bs', 's', 'ss', 'ng', 'j', 'ch', 'k', 't', 'p', 'h'];

const KANA_MAP = {
  'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o',
  'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko',
  'さ': 'sa', 'し': 'shi', 'す': 'su', 'せ': 'se', 'そ': 'so',
  'た': 'ta', 'ち': 'chi', 'つ': 'tsu', 'て': 'te', 'と': 'to',
  'な': 'na', 'に': 'ni', 'ぬ': 'nu', 'ね': 'ne', 'の': 'no',
  'は': 'ha', 'ひ': 'hi', 'ふ': 'fu', 'へ': 'he', 'ほ': 'ho',
  'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', 'も': 'mo',
  'や': 'ya', 'ゆ': 'yu', 'よ': 'yo',
  'ら': 'ra', 'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro',
  'わ': 'wa', 'を': 'wo', 'ん': 'n',
  'が': 'ga', 'ぎ': 'gi', 'ぐ': 'gu', 'げ': 'ge', 'ご': 'go',
  'ざ': 'za', 'じ': 'ji', 'ず': 'zu', 'ぜ': 'ze', 'ぞ': 'zo',
  'だ': 'da', 'ぢ': 'ji', 'づ': 'zu', 'で': 'de', 'ど': 'do',
  'ば': 'ba', 'び': 'bi', 'ぶ': 'bu', 'べ': 'be', 'ぼ': 'bo',
  'ぱ': 'pa', 'ぴ': 'pi', 'ぷ': 'pu', 'ぺ': 'pe', 'ぽ': 'po',
  'きゃ': 'kya', 'きゅ': 'kyu', 'きょ': 'kyo',
  'しゃ': 'sha', 'しゅ': 'shu', 'しょ': 'sho',
  'ちゃ': 'cha', 'ちゅ': 'chu', 'ちょ': 'cho',
  'にゃ': 'nya', 'にゅ': 'nyu', 'にょ': 'nyo',
  'ひゃ': 'hya', 'ひゅ': 'hyu', 'ひょ': 'hyo',
  'みゃ': 'mya', 'みゅ': 'myu', 'みょ': 'myo',
  'りゃ': 'rya', 'りゅ': 'ryu', 'りょ': 'ryo',
  'ぎゃ': 'gya', 'ぎゅ': 'gyu', 'ぎょ': 'gyo',
  'じゃ': 'ja', 'じゅ': 'ju', 'じょ': 'jo',
  'びゃ': 'bya', 'びゅ': 'byu', 'びょ': 'byo',
  'ぴゃ': 'pya', 'ぴゅ': 'pyu', 'ぴょ': 'pyo'
};

/**
 * Transliterates Korean Hangul syllables to Latin (Revised Romanization).
 * @param {string} text
 * @returns {string}
 */
export function romanizeHangul(text) {
  if (!text) return '';
  let out = '';
  for (const c of text) {
    const code = c.charCodeAt(0);
    // Hangul Syllables: 0xAC00 - 0xD7A3
    if (code >= 0xAC00 && code <= 0xD7A3) {
      const s = code - 0xAC00;
      const l = Math.floor(s / 588);
      const v = Math.floor((s % 588) / 28);
      const t = s % 28;
      out += HANGUL_INITIALS[l] + HANGUL_VOWELS[v] + HANGUL_FINALS[t];
    } else {
      out += c;
    }
  }
  return out;
}

/**
 * Transliterates Japanese Kana (Hiragana & Katakana) to Romaji (Hepburn).
 * @param {string} text
 * @returns {string}
 */
export function romanizeKana(text) {
  if (!text) return '';
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const pair = text.slice(i, i + 2);
    if (KANA_MAP[pair]) {
      out += KANA_MAP[pair];
      i++;
      continue;
    }

    const c = text[i];
    const code = c.charCodeAt(0);
    // Katakana (0x30A1-0x30F6) maps to Hiragana (0x3041-0x3096) via offset -0x60
    const normalized = (code >= 0x30A1 && code <= 0x30F6) ? String.fromCharCode(code - 0x60) : c;
    out += KANA_MAP[normalized] || c;
  }
  return out;
}

export default { romanizeHangul, romanizeKana };
