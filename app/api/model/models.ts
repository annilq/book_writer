import ollama from 'ollama'
export interface Model {
  name: string
  provider: string
}

export const getModels = async () => {
  let ollamaModels: Model[] = []
  try {
    const res = await ollama.list();
    ollamaModels = res.models?.map(model => ({ ...model, provider: "ollama" }))
  } catch (error) {
  }
  return [{ provider: "deepseek", name: "deepseek-reasoner" }, { provider: "deepseek", name: "deepseek-chat" }].concat(ollamaModels);
}