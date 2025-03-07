import ollama from 'ollama'
export interface Model {
  name: string
  provider: string
}
const deepsekAI = [
  { provider: "deepseek", name: "deepseek-reasoner" },
  { provider: "deepseek", name: "deepseek-chat" }
]
const alibaba = [
  { provider: "alibaba", name: "qwq-32b" },
  { provider: "alibaba", name: "deepseek-r1" },
  { provider: "alibaba", name: "deepseek-v3" }
]
export const getModels = async () => {
  let ollamaModels: Model[] = []
  try {
    const res = await ollama.list();
    ollamaModels = res.models?.map(model => ({ ...model, provider: "ollama" }))
  } catch (error) {
  }

  return [
    ...alibaba,
    ...deepsekAI,
  ].concat(ollamaModels);
}