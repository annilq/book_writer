import { NextRequest } from "next/server";
import LLMProvider from "@/utils/llms_provider";
import { Message } from "ai";
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { model, messages } = body;

  const [provider, modelName] = model.split("/")!;
  const llm = LLMProvider.getModel(provider, {
    model: modelName,
    temperature: 0,
    maxRetries: 2
  });

  const eventStream = llm.streamEvents(
    messages.map((message: Message) => {
      let messageData;
      switch (message.role) {
        case "user":
          messageData = new HumanMessage(message.content);
          break;
        case "assistant":
          messageData = new AIMessage(message.content);
          break;
        case "system":
          messageData = new SystemMessage(message.content);
          break;
        default:
          break;
      }
      return messageData;
    }),
    {
      version: "v2",
      encoding: "text/event-stream",
    }
  );

  return new Response(eventStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
