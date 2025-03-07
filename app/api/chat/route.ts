import { NextRequest } from "next/server";
import LLMProvider from "@/utils/llms_provider";
import { LangChainAdapter } from "ai";
import { AIMessage, HumanMessage } from "@langchain/core/messages";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { model, messages, chatId } = body;
  const [provider, modelName] = model.split("/");

  const llm = LLMProvider.getModel(provider, {
    model: modelName,
    temperature: 0,
    maxRetries: 2
  });

  const stream = await llm.stream(
    messages.map(message =>
      message.role == 'user'
        ? new HumanMessage(message.content)
        : new AIMessage(message.content),
    ),

  );
  // for await (const event of stream) {
  //   const eventType = event.event;
  //   if (eventType === "on_llm_end") {
  //     console.log(`Chat model chunk: ${event.data.chunk.message.content}`);
  //   }
  // }
  return LangChainAdapter.toDataStreamResponse(stream);
}
