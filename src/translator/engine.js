import config from '../config.js';
import logger from '../utils/logger.js';
import { loadGlossary, normalize } from './dictionary.js';
import {
  transliterateText,
  isRomanizedDialect,
  DIALECT_TO_CORE_LANG
} from './transliterate.js';

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
  } else if (/^[^"“\n]{3,}["“]([^"”\n]{2,})$/.test(cleaned)) {
    cleaned = cleaned.replace(/^[^"“\n]{3,}["“]([^"”\n]{2,})$/, '$1');
  }

  cleaned = cleaned
    .replace(/^["'`]+|["'`]+$/g, '')
    .trim()
    .replace(/^([^\s,]+માં|In [A-Za-z]+),?\s*(તે હશે|it would be|it is|it will be)\s*["'`:]*\s*/iu, '')
    .replace(/^([^\s:ઃ]+(\s+[^\s:ઃ]+)*\s*[:ઃ]\s*)/u, '')
    .replace(/^(गूज्लिश|gujlish|hinglish|હિંગ્લિશ|ગુજ્લિશ|banglish|tenglish|tanglish|kanglish|manglish|romaji|greeklish|arabizi)[,:\s]+/iu, '')
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
function buildPrompt(text, targetLang, sourceLang, tone = 'natural', context = null) {
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

  let contextDirectives = '';
  if (context) {
    if (typeof context === 'string' && context.trim()) {
      contextDirectives = `\nSociolinguistic Context: ${context.trim()}`;
    } else if (typeof context === 'object') {
      const rules = [];
      if (context.formality) {
        const isFormal = /formal|respect|honor|elder|senior/i.test(context.formality);
        rules.push(`Respect & Honorific Tier: ${context.formality} (${isFormal ? 'use respectful/honorific pronouns and verb forms such as tame/aap/vous/Usted/Sie' : 'use familiar/informal pronouns and verb forms such as tu/tum/du'})`);
      }
      if (context.recipient_gender) {
        rules.push(`Recipient Gender: ${context.recipient_gender} (conjugate 2nd-person verbs and adjectives to match recipient)`);
      }
      if (context.speaker_gender) {
        rules.push(`Speaker Gender: ${context.speaker_gender} (conjugate 1st-person verbs to match speaker)`);
      }
      if (context.relationship) {
        rules.push(`Relationship to Recipient: ${context.relationship}`);
      }
      if (context.age_group || context.age) {
        rules.push(`Age Tier: ${context.age_group || context.age}`);
      }
      if (context.additional_notes || context.notes) {
        rules.push(`Situational Notes: ${context.additional_notes || context.notes}`);
      }
      if (rules.length > 0) {
        contextDirectives = `\nSociolinguistic Context (Grammar & Honorifics Agreement):\n${rules.map(r => `- ${r}`).join('\n')}`;
      }
    }
  }

  const system = `You are a universal multilingual translator and localization engine. Translate the provided text${srcLabel} into ${targetLang}. For romanized regional dialects (e.g. Gujlish, Hinglish), translate the colloquial meaning accurately into ${targetLang}.
Style: Use a ${toneDesc}.${contextDirectives}
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
export async function translateText({ text, target_lang, source_lang = 'auto', tone = 'natural', glossary = null, context = null }) {
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

  // Map Romanized dialects to core languages for the neural model
  const isDialect = isRomanizedDialect(target);
  const modelTarget = isDialect ? (DIALECT_TO_CORE_LANG[target] || target) : target;

  // 2. Neural Model Translation (Ollama or OpenAI-compatible)
  try {
    const { system, prompt, stop } = buildPrompt(text, modelTarget, detectedSource, tone, context);
    let rawOutput = '';

    if (config.backend === 'openai_compatible') {
      rawOutput = await callOpenAiCompatible(system, prompt, stop);
    } else {
      rawOutput = await callOllama(system, prompt, stop);
    }

    let translated = cleanOutput(rawOutput, modelTarget, text);

    // If Romanized dialect requested, transliterate the native script to Latin
    if (isDialect) {
      translated = transliterateText(translated, target);
    }

    return {
      translated: translated || text,
      source_lang: detectedSource,
      target_lang: target,
      ...(context ? { context } : {}),
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
