import express from 'express';
import fs from 'node:fs';
import config from '../config.js';
import logger from '../utils/logger.js';
import { handleMcpRequest } from './server.js';
import { translateText } from '../translator/engine.js';
import { loadGlossary } from '../translator/dictionary.js';

/**
 * Creates and starts the Universal Translator HTTP daemon.
 * @returns {import('http').Server}
 */
export function startHttpServer() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));

  // CORS headers
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
  });

  // 1. Health check
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      service: 'syndae-translator',
      version: '1.1.0',
      uptime: process.uptime()
    });
  });

  // 2. Status & Configuration
  app.get('/status', (req, res) => {
    res.json({
      service: 'syndae-translator',
      backend: config.backend,
      model: config.translationModel,
      ollama_url: config.ollamaBaseUrl,
      api_url: config.apiUrl,
      default_target: config.defaultTargetLang,
      glossary_path: config.glossaryPath,
      port: config.port,
      status: 'ready'
    });
  });

  // 3. Instructions endpoint for Syndae auto-ingestion
  app.get('/instructions', (req, res) => {
    try {
      if (fs.existsSync(config.instructionsPath)) {
        const instructions = fs.readFileSync(config.instructionsPath, 'utf-8');
        return res.json({
          success: true,
          name: 'translator',
          title: 'Universal Multi-Language Translation Integration',
          instructions
        });
      }
      res.status(404).json({ success: false, error: 'instructions.md not found' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 4. Glossary inspection & expansion endpoint
  app.get('/glossary', (req, res) => {
    const data = loadGlossary();
    res.json({ success: true, count: data.phrases?.length || 0, ...data });
  });

  // 5. MCP JSON-RPC Endpoint
  app.post('/mcp', async (req, res) => {
    try {
      const response = await handleMcpRequest(req.body);
      if (response === null) return res.status(204).end();
      res.json(response);
    } catch (err) {
      logger.error({ err }, 'Error handling MCP request');
      res.status(500).json({
        jsonrpc: '2.0',
        id: req.body?.id || null,
        error: { code: -32603, message: `Internal server error: ${err.message}` }
      });
    }
  });

  // 6. REST convenience endpoint (POST)
  app.post('/translate', async (req, res) => {
    try {
      const { text, target_lang, source_lang = 'auto', tone = 'natural', glossary } = req.body || {};
      if (!text) {
        return res.status(400).json({ success: false, error: 'text is required in body' });
      }
      const result = await translateText({ text, target_lang, source_lang, tone, glossary });
      res.json({ success: true, ...result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 7. REST convenience endpoint (GET)
  app.get('/translate', async (req, res) => {
    try {
      const text = req.query.text || req.query.q;
      if (!text) {
        return res.status(400).json({ success: false, error: 'text or q query parameter required' });
      }
      const target_lang = req.query.target_lang || req.query.to || config.defaultTargetLang;
      const source_lang = req.query.source_lang || req.query.from || 'auto';
      const tone = req.query.tone || 'natural';

      const result = await translateText({ text, target_lang, source_lang, tone });
      res.json({ success: true, ...result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  const server = app.listen(config.port, config.host, () => {
    logger.info(
      { port: config.port, backend: config.backend, model: config.translationModel },
      'Syndae Universal Multi-Language Translator Server listening'
    );
  });

  return server;
}

export default { startHttpServer };
