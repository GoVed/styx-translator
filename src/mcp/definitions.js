/**
 * MCP tool catalog definitions for Universal Multi-Language Translator (2024-11-05 spec).
 */
export const TOOL_DEFINITIONS = [
  {
    name: 'translate',
    description: 'Translate text between any languages worldwide (English, Spanish, French, German, Japanese, Chinese, Hindi, Gujarati, Arabic, Russian, Portuguese, etc.) and colloquial chat dialects (Gujlish, Hinglish). MANDATORY DIRECTIVE: On incoming non-English messages, invoke this tool with target_lang: "english" immediately to translate. The agent MUST ALWAYS reason, communicate, and formulate options in 100% English. Never manually compose non-English or dialect text in thoughts, prose, or options; formulate options in English and invoke this translate tool to perform the translation.',
    inputSchema: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'The English text string to translate into the target language, or foreign text to translate into English.'
        },
        target_lang: {
          type: 'string',
          description: 'Target language name or code: e.g. "spanish", "french", "german", "hindi", "gujarati", "gujlish", "japanese", "chinese", "arabic", "english", etc.'
        },
        source_lang: {
          type: 'string',
          description: 'Source language name/code, or "auto" to detect automatically (default: "auto").'
        },
        tone: {
          type: 'string',
          enum: ['natural', 'casual', 'formal', 'business', 'slang'],
          description: 'Tone style: "natural" (default conversational), "casual" (messaging), "formal" (polite), "business" (professional), or "slang" (colloquial).'
        },
        glossary: {
          type: 'object',
          description: 'Optional key-value glossary mapping to override specific domain words or brand names.'
        }
      },
      required: ['text', 'target_lang']
    }
  }
];

export default { TOOL_DEFINITIONS };
