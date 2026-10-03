import { TOOL_DEFINITIONS } from './definitions.js';
import { translateText } from '../translator/engine.js';
import logger from '../utils/logger.js';

/**
 * Handles incoming MCP JSON-RPC requests.
 * @param {object} rpcRequest
 * @returns {Promise<object | null>}
 */
export async function handleMcpRequest(rpcRequest) {
  const { id, method, params } = rpcRequest || {};

  if (!method) {
    return {
      jsonrpc: '2.0',
      id: id || null,
      error: { code: -32600, message: 'Invalid Request: Missing method' }
    };
  }

  // 1. Initialize Handshake
  if (method === 'initialize') {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: { listChanged: false }
        },
        serverInfo: {
          name: 'styx-translator',
          version: '1.0.0'
        }
      }
    };
  }

  // 2. Initialized notification
  if (method === 'notifications/initialized') {
    return null;
  }

  // 3. Tools Listing
  if (method === 'tools/list') {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        tools: TOOL_DEFINITIONS
      }
    };
  }

  // 4. Tools Calling
  if (method === 'tools/call') {
    const { name, arguments: args } = params || {};
    try {
      logger.info({ tool: name, args }, 'Executing Translator MCP tool call');

      if (name === 'translate') {
        if (!args || !args.text) {
          throw new Error('Missing required argument: text');
        }
        if (!args.target_lang) {
          throw new Error('Missing required argument: target_lang');
        }

        const translationResult = await translateText(args);
        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(translationResult, null, 2)
              }
            ],
            isError: false
          }
        };
      }

      return {
        jsonrpc: '2.0',
        id,
        error: { code: -32601, message: `Tool not found: ${name}` }
      };
    } catch (err) {
      logger.error({ tool: name, err: err.message }, 'Translation tool execution error');
      return {
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text: `Error executing ${name}: ${err.message}`
            }
          ],
          isError: true
        }
      };
    }
  }

  return {
    jsonrpc: '2.0',
    id,
    error: { code: -32601, message: `Method not found: ${method}` }
  };
}

export default { handleMcpRequest };
