import { NextRequest } from "next/server";
import LLMProvider from "@/utils/llms_provider";
import { LangChainAdapter, Message } from "ai";
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { model, messages } = body;
  const [provider, modelName] = model.split("/");

  const llm = LLMProvider.getModel(provider, {
    model: modelName,
    temperature: 0,
    maxRetries: 2
  });

  const stream = await llm.stream(
    messages.map((message:Message) => {
      let messageData
      switch (message.role) {
        case "user":
          messageData = new HumanMessage(message.content)
          break;
        case "assistant":
          messageData = new AIMessage(message.content)
          break;
        case "system":
          messageData = new SystemMessage(message.content)
          break;
        default:
          break;
      }
      return messageData
    })
  );

  return LangChainAdapter.toDataStreamResponse(stream);
}
