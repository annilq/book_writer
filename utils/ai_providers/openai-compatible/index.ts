import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

const openaicompatible = createOpenAICompatible({
  name: 'alibaba',
  apiKey: process.env.DASHSCOPE_API_KEY,
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
});

export default openaicompatible