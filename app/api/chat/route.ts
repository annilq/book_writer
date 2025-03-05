import { NextRequest } from "next/server";
import { appResponse } from "@/utils/response";
import LLMProvider from "@/utils/llms_provider";
import { LangChainAdapter } from "ai";
import { AIMessage, HumanMessage } from "@langchain/core/messages";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  return appResponse(async () => {
    const { model, messages, chatId } = await req.json();
    const [provider, modelName] = model.split("/");

    const llm = LLMProvider.getModel(provider, {
      model: modelName,
      temperature: 0,
      maxRetries: 2
    });
    console.log(new HumanMessage("message.content"));
    console.log(new AIMessage("message.content"));
    return
    const stream = await llm.streamEvents(
      messages.map(message =>
        message.role == 'user'
          ? new HumanMessage(message.content)
          : new AIMessage(message.content),
      ),
      {
        version: "v2"
      }
    );
    for await (const event of stream) {
      const eventType = event.event;
      if (eventType === "on_llm_end") {
        console.log(`Chat model chunk: ${event.data.chunk.message.content}`);
      }
    }
    return LangChainAdapter.toDataStreamResponse(stream);
  });
}
