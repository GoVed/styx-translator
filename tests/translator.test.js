import assert from 'node:assert';
import { normalize } from '../src/translator/dictionary.js';
import { detectLanguage, cleanOutput, translateText } from '../src/translator/engine.js';
import { handleMcpRequest } from '../src/mcp/server.js';
import { TOOL_DEFINITIONS } from '../src/mcp/definitions.js';

let passed = 0;
let total = 0;

function test(name, fn) {
  total++;
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}:`, err.message);
    throw err;
  }
}

async function testAsync(name, fn) {
  total++;
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}:`, err.message);
    throw err;
  }
}

console.log('--- Running Universal Multi-Language Translator Tests ---');

// 1. Text Normalization
test('Dictionary: normalize text', () => {
  assert.strictEqual(normalize('  Cómo estás?!!  '), 'cómo estás');
  assert.strictEqual(normalize('WHAT ARE   YOU DOING?'), 'what are you doing');
});

// 2. Global Script & Language Detection Tests
test('Detection: detect diverse global script families', () => {
  assert.strictEqual(detectLanguage('مرحبا كيف حالك'), 'arabic');
  assert.strictEqual(detectLanguage('Привет мир'), 'cyrillic');
  assert.strictEqual(detectLanguage('你好世界'), 'chinese');
  assert.strictEqual(detectLanguage('こんにちは'), 'japanese');
  assert.strictEqual(detectLanguage('안녕하세요'), 'korean');
  assert.strictEqual(detectLanguage('नमस्ते आप कैसे हैं'), 'devanagari');
  assert.strictEqual(detectLanguage('કેમ છો'), 'gujarati');
  assert.strictEqual(detectLanguage('Γειά σου κόσμε'), 'greek');
  assert.strictEqual(detectLanguage('שלום עולם'), 'hebrew');
  assert.strictEqual(detectLanguage('สวัสดีชาวโลก'), 'thai');
  assert.strictEqual(detectLanguage('Hello, this is English text'), 'latin');
});

// 3. Output Cleansing & Sentence Extraction
test('Engine: cleanOutput removes labels, markdown, and quotes across languages', () => {
  assert.strictEqual(cleanOutput(' "Hola amigo" ', 'spanish'), 'Hola amigo');
  assert.strictEqual(cleanOutput('Spanish: Buenos días\nExplanation: Morning greeting', 'spanish'), 'Buenos días');
  assert.strictEqual(cleanOutput('Translation: Ciao mondo', 'italian'), 'Ciao mondo');
  assert.strictEqual(cleanOutput('French: "Bonjour le monde"', 'french'), 'Bonjour le monde');
});

// 4. Runtime Caller Overrides & Identity
await testAsync('Engine: runtime dynamic glossary override for brand terms', async () => {
  const res = await translateText({
    text: 'Styx Agent OS',
    target_lang: 'french',
    glossary: { 'Styx Agent OS': 'Système Styx' }
  });
  assert.strictEqual(res.translated, 'Système Styx');
  assert.strictEqual(res.provider, 'runtime_glossary');
});

await testAsync('Engine: identity translation when explicit source equals target', async () => {
  const res = await translateText({ text: 'Bonjour tout le monde', target_lang: 'french', source_lang: 'french' });
  assert.strictEqual(res.translated, 'Bonjour tout le monde');
  assert.strictEqual(res.provider, 'identity');
});

// 5. Neural Model Translation
await testAsync('Engine: model translation via neural LLM', async () => {
  const res = await translateText({
    text: 'Hello, how are you today?',
    target_lang: 'spanish'
  });
  assert.strictEqual(res.provider, 'model');
  assert.ok(res.translated.length > 0);
  assert.ok(res.latency_ms > 0);
});

// 6. MCP Protocol Tests
test('MCP: definitions schema is universal', () => {
  assert.ok(Array.isArray(TOOL_DEFINITIONS));
  assert.strictEqual(TOOL_DEFINITIONS[0].name, 'translate');
  assert.deepStrictEqual(TOOL_DEFINITIONS[0].inputSchema.required, ['text', 'target_lang']);
});

await testAsync('MCP: initialize handshake', async () => {
  const res = await handleMcpRequest({ jsonrpc: '2.0', id: 1, method: 'initialize' });
  assert.strictEqual(res.result.protocolVersion, '2024-11-05');
  assert.strictEqual(res.result.serverInfo.name, 'styx-translator');
});

await testAsync('MCP: tools/list returns universal translate tool', async () => {
  const res = await handleMcpRequest({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
  assert.strictEqual(res.result.tools[0].name, 'translate');
});

await testAsync('MCP: tools/call translate executes neural model', async () => {
  const res = await handleMcpRequest({
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'translate',
      arguments: {
        text: 'Good morning',
        target_lang: 'spanish'
      }
    }
  });

  assert.strictEqual(res.result.isError, false);
  const data = JSON.parse(res.result.content[0].text);
  assert.strictEqual(data.provider, 'model');
  assert.ok(data.translated.length > 0);
});

console.log(`\nAll ${passed}/${total} Universal Translator tests passed successfully!\n`);
