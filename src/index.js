#!/usr/bin/env node
import { Command } from 'commander';
import config from './config.js';
import logger from './utils/logger.js';
import { startHttpServer } from './mcp/http.js';
import { translateText } from './translator/engine.js';

const program = new Command();

program
  .name('styx-translator')
  .description('Universal Multi-Language Neural Translator for Styx Agent OS')
  .version('1.1.0');

program
  .command('daemon')
  .description('Start the Translator MCP HTTP daemon service')
  .action(() => {
    logger.info('Starting Universal Multi-Language Translator daemon...');
    startHttpServer();
  });

program
  .command('translate <text>')
  .description('Directly translate text via CLI')
  .option('-t, --to <target_lang>', 'Target language (e.g. spanish, french, german, japanese, english)', 'english')
  .option('-f, --from <source_lang>', 'Source language or auto', 'auto')
  .option('--tone <tone>', 'Tone: natural, casual, formal, business, slang', 'natural')
  .action(async (text, options) => {
    try {
      const res = await translateText({
        text,
        target_lang: options.to,
        source_lang: options.from,
        tone: options.tone
      });
      console.log(JSON.stringify(res, null, 2));
    } catch (err) {
      console.error('Translation failed:', err.message);
      process.exit(1);
    }
  });

// If no arguments passed, default to daemon
if (process.argv.length <= 2) {
  startHttpServer();
} else {
  program.parse(process.argv);
}
