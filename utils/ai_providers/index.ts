import { deepseek } from '@ai-sdk/deepseek';
import { openai } from '@ai-sdk/openai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import openaicompatible from './openai-compatible';

// Ollama exposes an OpenAI-compatible endpoint at /v1.
// There is no official @ai-sdk/ollama provider for AI SDK 5/7, so we
// route Ollama through the OpenAI-compatible factory.
const ollama = createOpenAICompatible({
  name: 'ollama',
  apiKey: process.env.OLLAMA_API_KEY || 'ollama',
  baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1',
});

export function getAIModel(provider: string, id: string, config: any = {}) {
  switch (provider.toLowerCase()) {
    case 'ollama':
      return ollama(id, config);
    case 'deepseek':
      return deepseek(id, config);
    case 'openai':
      return openai(id, config);
    case 'alibaba':
      return openaicompatible(id, config);
    default:
      throw new Error(`Unsupported model provider: ${provider}`);
  }
}
