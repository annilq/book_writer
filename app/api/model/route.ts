import { appResponse } from '@/utils/response';
import ollama from 'ollama'

export async function GET(request: Request) {
  return appResponse(async () => {
    const res = await ollama.list();
    const ollamaModels = res.models?.map(model => ({ ...model, provider: "ollama" }))
    return [{ provider: "deepseek", name: "deepseek-reasoner" }].concat(ollamaModels);
  });
}
