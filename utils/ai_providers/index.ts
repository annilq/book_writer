import { deepseek } from '@ai-sdk/deepseek';
import { openai } from '@ai-sdk/openai';
import { ollama } from 'ollama-ai-provider';
import openaicompatible from './openai-compatible';

export function getAIModel(provider: string, id: string, config: any={}) {
  switch (provider.toLowerCase()) {
    case 'ollama':
      return ollama(id, config);
    case 'deepseek':
      return deepseek(id, config);
    case 'openAI':
      return openai(id, config);
    case 'alibaba':
      return openaicompatible(id, config);
    default:
      throw new Error(`Unsupported model provider: ${provider}`);
  }
}
