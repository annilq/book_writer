import { NextRequest, NextResponse } from "next/server";
import { Message as VercelChatMessage, StreamingTextResponse } from "ai";

import { PromptTemplate } from "@langchain/core/prompts";
import { HttpResponseOutputParser } from "langchain/output_parsers";
import LLMProvider from "@/utils/llms_provider";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { createChat } from "./actions";
import { appResponse } from "@/utils/response";

export const runtime = "edge";

interface OutLine {
  name: string;
  id: string;
  children: OutLine[];
}

const formatMessage = (message: VercelChatMessage) => {
  return `${message.role}: ${message.content}`;
};

const TEMPLATE = `
  You are now a professional writer, skilled in creating works in the {categories} fields. Please create a book outline based on the following information:
  Book Title:{title}
  Book description:{description}
  Coherence requirements:
    -	Relevance to the context
    -	Rationality of character actions
    -	Smoothness of plot development
    -	Keep the Emotional tone, Core theme, Writing style Consistency and Integrity
  {chat_history}
  {input}
  AI:
  `;

/**
 * This handler initializes and calls a simple chain with a prompt,
 * chat model, and output parser. See the docs for more information:
 *
 * https://js.langchain.com/docs/guides/expression_language/cookbook#prompttemplate--llm--outputparser
 */
export async function POST(req: NextRequest) {
  return appResponse(async () => {
    const body = await req.json();
    const model = body.model;
    const title = body.title;
    const id = body.id;
    const categories = body.categories;
    const description = body.description;

    const book = await createChat({ id, model, title, description, categories })

    // const formattedPreviousMessages = messages.slice(0, -1).map(formatMessage);
    // const currentMessageContent = messages[messages.length - 1].content;
    // const prompt = PromptTemplate.fromTemplate(TEMPLATE);
    // const parser = new JsonOutputParser<OutLine>();

    /**
     * You can also try e.g.:
     *
     * import { ChatAnthropic } from "@langchain/anthropic";
     * const model = new ChatAnthropic({});
     *
     * See a full list of supported models at:
     * https://js.langchain.com/docs/modules/model_io/models/
     */

    // Get model instance from provider

    // const llm = LLMProvider.getModel(provider, {
    //   model,
    //   temperature: 0,
    //   maxRetries: 2
    // });
    /**
     * Chat models stream message chunks rather than bytes, so this
     * output parser handles serialization and byte-encoding.
     */
    // const outputParser = new HttpResponseOutputParser();

    // /**
    //  * Can also initialize as:
    //  *
    //  * import { RunnableSequence } from "@langchain/core/runnables";
    //  * const chain = RunnableSequence.from([prompt, model, outputParser]);
    //  */
    // const chain = prompt.pipe(llm).pipe(outputParser);

    // const stream = await chain.stream({
    //   title,
    //   description,
    //   categories,
    //   chat_history: formattedPreviousMessages.join("\n"),
    //   input: currentMessageContent,
    //   parse: parser.getFormatInstructions()
    // });

    return book

  });

}
