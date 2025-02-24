"use server";

import { getPrisma } from "@/utils/prisma";
import {
  getMainCodingPrompt,
  softwareArchitectPrompt,
} from "@/utils/prompts";

import { notFound } from "next/navigation";
import LLMProvider from "@/utils/llms_provider";
import { HttpResponseOutputParser } from 'langchain/output_parsers';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from "@langchain/core/prompts";
import { Chapter } from "@prisma/client";

const TEMPLATE = `
  You are now a professional writer, skilled in creating works in the {categories} fields. Please create a book outline based on the following information:
  Book Title:{title}
  Book description:{description}
  Coherence requirements:
    -	Relevance to the context
    -	Rationality of character actions
    -	Smoothness of plot development
    -	Keep the Emotional tone, Core theme, Writing style Consistency and Integrity
  AI:
  `;

export async function createChat(
  { id,
    title,
    model,
    description,
    categories,
  }: {
    id: string,
    title: string,
    model: string,
    description: string,
    categories: string[],
  }
) {
  const [provider, modelName] = model.split("/")

  const prisma = getPrisma();
  const chat = await prisma.book.create({
    data: {
      id,
      model,
      prompt: description,
      title,
      categories: {
        connect: categories.map(name => ({ name }))
      },
      description
    },
  });

  async function fetchBookOutline() {
    const parser = new JsonOutputParser<Chapter[]>();
    const prompt = PromptTemplate.fromTemplate(TEMPLATE);
    const llm = LLMProvider.getModel(provider, {
      model: modelName,
      temperature: 0,
      maxRetries: 2
    });

    // const outputParser = new HttpResponseOutputParser();

    const chain = prompt.pipe(llm).pipe(parser);

    // const stream = await chain.stream({
    //   title,
    //   description,
    //   categories,
    //   chat_history: formattedPreviousMessages.join("\n"),
    //   input: currentMessageContent,
    //   parse: parser.getFormatInstructions()
    // });
    const writerPrompts = await chain.invoke({
      title,
      description,
      categories,
      // chat_history: formattedPreviousMessages.join("\n"),
      // input: currentMessageContent,
      parse: parser.getFormatInstructions()
    });

    // const mostSimilarExample =
    //   writerPrompts..content ? JSON.parse(writerPrompts?.message.content).content : softwareArchitectPrompt;
    return writerPrompts;
  }
  const chapters = await fetchBookOutline();
  let userMessage = description;

  let newChat = await prisma.book.update({
    where: {
      id: chat.id,
    },
    data: {
      chapters: { createMany: { data: chapters } },
      // messages: { createMany: { data: llm.message } }
    },
    include: {
      messages: true,
      chapters: true
    },
  });

  const lastMessage = newChat.messages
    .sort((a, b) => a.position - b.position)
    .at(-1);
  if (!lastMessage) throw new Error("No new message");

  return {
    chat: chat,
    messages: newChat.messages,
    lastMessageId: lastMessage.id,
  };
}

export async function createMessage(
  bookId: string,
  text: string,
  role: "assistant" | "user",
) {
  const prisma = getPrisma();
  const chat = await prisma.book.findUnique({
    where: { id: bookId },
    include: { messages: true },
  });
  if (!chat) notFound();

  const maxPosition = Math.max(...chat.messages.map((m) => m.position));

  const newMessage = await prisma.message.create({
    data: {
      role,
      content: text,
      position: maxPosition + 1,
      bookId,
    },
  });

  return newMessage;
}
