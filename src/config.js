import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

export const config = {
  port: parseInt(process.env.HTTP_PORT || '8772', 10),
  host: process.env.HTTP_HOST || '0.0.0.0',
  logLevel: process.env.LOG_LEVEL || 'info',

  // Backend provider: 'ollama' | 'openai_compatible'
  backend: (process.env.TRANSLATION_BACKEND || 'ollama').toLowerCase(),

  // Ollama configuration
  ollamaBaseUrl: (process.env.OLLAMA_BASE_URL || 'http://localhost:11434').replace(/\/+$/, ''),

  // OpenAI-compatible endpoint configuration (vLLM, llama-server, Groq, OpenAI, etc.)
  apiUrl: (process.env.TRANSLATION_API_URL || 'http://localhost:11434/v1').replace(/\/+$/, ''),
  apiKey: process.env.TRANSLATION_API_KEY || '',

  // Translation Model ID (e.g. qwen2.5:3b, llama3.2, sarvam-1, gemma2, etc.)
  translationModel: process.env.TRANSLATION_MODEL || 'sarvam-1',

  // Default target language when unspecified
  defaultTargetLang: process.env.DEFAULT_TARGET_LANG || 'english',

  // Syndae Host Integration
  syndaeApiUrl: process.env.SYNDAE_API_URL || 'http://localhost:3000',
  syndaeAccessKey: process.env.SYNDAE_ACCESS_KEY || 'syndae-local-dev-key',

  // Directory paths
  rootDir,
  instructionsPath: path.join(rootDir, 'instructions.md'),
  manifestPath: path.join(rootDir, 'manifest.json'),
  glossaryPath: process.env.CUSTOM_GLOSSARY_PATH
    ? path.resolve(rootDir, process.env.CUSTOM_GLOSSARY_PATH)
    : path.join(rootDir, 'data', 'glossary.json')
};

export default config;
