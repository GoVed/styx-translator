import config from '../config.js';
import logger from '../utils/logger.js';
import { loadGlossary, normalize } from './dictionary.js';
import { gujaratiToGujlish, devanagariToHinglish } from './transliterate.js';

/**
 * Detects common writing scripts and alphabet families via Unicode ranges.
 * @param {string} text
 * @returns {string}
 */
export function detectLanguage(text) {
  if (!text) return 'auto';

  // Major Unicode Script Blocks
  if (/[\u0600-\u06FF]/.test(text)) return 'arabic';
  if (/[\u0400-\u04FF]/.test(text)) return 'cyrillic';
  if (/[\u4E00-\u9FFF]/.test(text)) return 'chinese';
  if (/[\u3040-\u30FF]/.test(text)) return 'japanese';
  if (/[\uAC00-\uD7AF]/.test(text)) return 'korean';
  if (/[\u0900-\u097F]/.test(text)) return 'devanagari';
  if (/[\u0A80-\u0AFF]/.test(text)) return 'gujarati';
  if (/[\u0980-\u09FF]/.test(text)) return 'bengali';
  if (/[\u0370-\u03FF]/.test(text)) return 'greek';
  if (/[\u0590-\u05FF]/.test(text)) return 'hebrew';
  if (/[\u0E00-\u0E7F]/.test(text)) return 'thai';
  if (/[a-zA-Z]/.test(text)) return 'latin';

  return 'auto';
}

/**
 * Strips unwanted model artifacts, prefixes, quotes, and conversational explanations.
 * @param {string} raw
 * @param {string} targetLang
 * @param {string} [originalText='']
 * @returns {string}
 */
export function cleanOutput(raw, targetLang, originalText = '') {
  if (!raw) return '';
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
  let cleaned = (lines[0] || '').trim()
    .replace(/<\/?[a-z0-9_-]+>/gi, '')
    .trim();

  // Extract quoted text if the model returned an explanation sentence containing quotes
  const quotes = [...cleaned.matchAll(/["“]([^"”\n]{2,})["”]/g)].map(m => m[1].trim());
  if (quotes.length > 0) {
    const candidate = quotes.length > 1 && originalText
      ? quotes.find(q => q.toLowerCase() !== originalText.trim().toLowerCase()) || quotes[quotes.length - 1]
      : quotes[quotes.length - 1];
    if (candidate) cleaned = candidate;
  }

  cleaned = cleaned
    .replace(/^["'`]+|["'`]+$/g, '')
    .trim()
    .replace(/^([^\s:ઃ]+(\s+[^\s:ઃ]+)*\s*[:ઃ]\s*)/u, '')
    .replace(/^(गूज्लिश|gujlish|hinglish|હિંગ્લિશ|ગુજ્લિશ)[,:\s]+/iu, '')
    .trim()
    .replace(/^["'`]+|["'`]+$/g, '')
    .replace(/\s*(Note|Explanation|Breakdown|Pronunciation):[\s\S]*$/i, '')
    .trim();

  return cleaned.trim();
}

/**
 * Builds universal prompt for any language pair and tone.
 * @param {string} text
 * @param {string} targetLang
 * @param {string} sourceLang
 * @param {string} tone
 * @returns {{ system: string, prompt: string, stop: string[] }}
 */
function buildPrompt(text, targetLang, sourceLang, tone = 'natural') {
  const toneMap = {
    natural: 'natural, fluent conversational style',
    casual: 'casual, informal everyday chat style',
    formal: 'respectful, grammatically formal style',
    business: 'professional business enterprise terminology',
    slang: 'colloquial, modern slang'
  };
  const toneDesc = toneMap[(tone || 'natural').toLowerCase()] || 'natural conversational style';

  const srcLabel = (sourceLang && sourceLang !== 'auto' && sourceLang.toLowerCase() !== 'latin' && sourceLang.toLowerCase() !== targetLang.toLowerCase())
    ? ` from ${sourceLang}`
    : '';

  const system = `You are a universal multilingual translator and localization engine. Translate the provided text${srcLabel} into ${targetLang}. For romanized regional dialects (e.g. Gujlish, Hinglish), translate the colloquial meaning accurately into ${targetLang}.
Style: Use a ${toneDesc}.
Formatting: Output ONLY the direct translation. Never include explanations, grammar breakdowns, notes, pronunciation guides, or quotation marks.`;

  const prompt = `Translate to ${targetLang}: "${text}"`;
  const stop = ['\n\n', 'Translation:', 'Explanation:', 'Note:'];

  return { system, prompt, stop };
}

/**
 * Executes translation via Ollama chat completions endpoint.
 */
async function callOllama(system, prompt, stop) {
  const url = `${config.ollamaBaseUrl}/api/chat`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.translationModel,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt }
        ],
        stream: false,
        options: { temperature: 0.1, top_p: 0.9, stop }
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(`Ollama error HTTP ${res.status}`);
    const data = await res.json();
    return data.message?.content || data.response || '';
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Executes translation via OpenAI-compatible endpoint (vLLM, llama-server, Groq, OpenAI, etc.).
 */
async function callOpenAiCompatible(system, prompt, stop) {
  const url = `${config.apiUrl}/chat/completions`;
  const headers = { 'Content-Type': 'application/json' };
  if (config.apiKey) headers['Authorization'] = `Bearer ${config.apiKey}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: config.translationModel,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        stop
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(`API error HTTP ${res.status}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Main universal translation execution function.
 * @param {object} params
 * @param {string} params.text
 * @param {string} [params.target_lang]
 * @param {string} [params.source_lang='auto']
 * @param {'natural' | 'casual' | 'formal' | 'business' | 'slang'} [params.tone='natural']
 * @param {object} [params.glossary]
 * @returns {Promise<object>}
 */
export async function translateText({ text, target_lang, source_lang = 'auto', tone = 'natural', glossary = null }) {
  if (!text || !text.trim()) {
    return { translated: '', source_lang, target_lang, provider: 'none', latency_ms: 0 };
  }

  const startTime = Date.now();
  const detectedSource = source_lang === 'auto' ? detectLanguage(text) : source_lang.toLowerCase();
  const target = (target_lang || config.defaultTargetLang || 'english').toLowerCase();

  // Identity check - skip if source language was explicitly specified and matches target
  if (source_lang !== 'auto' && detectedSource === target) {
    return {
      translated: text.trim(),
      source_lang: detectedSource,
      target_lang: target,
      provider: 'identity',
      latency_ms: Date.now() - startTime
    };
  }

  // 1. User runtime glossary overrides for custom brand names or terminology
  const cleanInput = text.trim();
  const normalizedInput = normalize(text);
  if (glossary && typeof glossary === 'object' && (glossary[cleanInput] || glossary[normalizedInput])) {
    return {
      translated: glossary[cleanInput] || glossary[normalizedInput],
      source_lang: detectedSource,
      target_lang: target,
      provider: 'runtime_glossary',
      latency_ms: Date.now() - startTime
    };
  }

  // 2. Pre-configured dictionary glossary
  const loaded = loadGlossary();
  const dictTerms = loaded?.terms || {};
  const matched = dictTerms[cleanInput] || dictTerms[normalizedInput]
    || Object.entries(dictTerms).find(([k]) => normalize(k) === normalizedInput)?.[1];

  if (matched) {
    return {
      translated: matched,
      source_lang: detectedSource,
      target_lang: target,
      provider: 'glossary',
      latency_ms: Date.now() - startTime
    };
  }

  // Map Romanized dialects to core Indic languages for the neural model
  let modelTarget = target;
  if (target === 'gujlish') modelTarget = 'gujarati';
  else if (target === 'hinglish') modelTarget = 'hindi';

  // 2. Neural Model Translation (Ollama or OpenAI-compatible)
  try {
    const { system, prompt, stop } = buildPrompt(text, modelTarget, detectedSource, tone);
    let rawOutput = '';

    if (config.backend === 'openai_compatible') {
      rawOutput = await callOpenAiCompatible(system, prompt, stop);
    } else {
      rawOutput = await callOllama(system, prompt, stop);
    }

    let translated = cleanOutput(rawOutput, modelTarget, text);

    // If Romanized dialect requested, transliterate Indic script to Latin
    if (target === 'gujlish' && (detectLanguage(translated) === 'gujarati' || /[\u0A80-\u0AFF]/.test(translated))) {
      translated = gujaratiToGujlish(translated);
    } else if (target === 'hinglish' && (detectLanguage(translated) === 'devanagari' || /[\u0900-\u097F]/.test(translated))) {
      translated = devanagariToHinglish(translated);
    }

    return {
      translated: translated || text,
      source_lang: detectedSource,
      target_lang: target,
      model: config.translationModel,
      backend: config.backend,
      provider: 'model',
      latency_ms: Date.now() - startTime
    };
  } catch (err) {
    logger.warn({ err: err.message, text }, 'Translation model fallback');

    return {
      translated: text,
      source_lang: detectedSource,
      target_lang: target,
      error: `Translation error: ${err.message}`,
      provider: 'fallback_raw',
      latency_ms: Date.now() - startTime
    };
  }
}

export default { translateText, detectLanguage, cleanOutput };
