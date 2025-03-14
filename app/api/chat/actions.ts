"use server";

import { getPrisma, prisma } from "@/utils/prisma";
import { notFound } from "next/navigation";
import LLMProvider from "@/utils/llms_provider";
import { StringOutputParser, StructuredOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate, MessagesPlaceholder, PromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import { getBookPrompt, getStandardBookPrompt } from "@/utils/prompts";
import { ChapterInput, flattenChaptersWithPosition } from "@/utils";
import { FormSchema } from "@/app/(main)/components/BookOutlineForm";
import { RunnableSequence } from "@langchain/core/runnables";
import { Book, Message } from "@prisma/client";
import { getI18n } from "@/utils/i18n/server";
import { CreateMessage } from "ai";

export async function createBook(
  book: z.infer<typeof FormSchema> & { id: string }
) {
  const {
    id,
    title,
    model,
    description,
    language = 'en',
    categories,
  } = book
  const i18n = getI18n(language);
  try {
    const [provider, modelName] = model.split("/");
    if (!provider || !modelName) {
      console.error("Invalid model format. Expected 'provider/model'");
      return null;
    }

    const prisma = getPrisma();

    const bookdata = await prisma.book.create({
      data: {
        id,
        model,
        title,
        language,
        prompt: description,
        categories: {
          connect: [categories].map(name => ({ name }))
        },
        description
      },
    });

    const bookPrompt: string = await fetchBookPrompt(book);
    const updatedBook = await prisma.book.update({
      where: {
        id: bookdata.id,
      },
      data: {
        prompt: bookPrompt,
        messages: {
          createMany: {
            data: [
              // {
              //   role: "system",
              //   content: bookPrompt,
              //   position: 0,
              // },
              {
                role: "user",
                content: i18n.t("bookOutlinePrompt",
                  {
                    title,
                    description
                  }
                ),
                position: 1
              }
            ],
          },
        },
      },
      include: {
        messages: true,
      }
    });

    return updatedBook


  } catch (error) {
    console.error("Error in createBook:", error);
    return null;
  }
}

export async function fetchBookOutline(
  book: Book,
  messages: Message
) {

  const ChapterModel: z.ZodType<any> = z.lazy(() => z.object({
    id: z.string().min(5),
    title: z.string().min(3),
    content: z.string().min(20),
    children: z.array(ChapterModel)
  }));

  const ChaptersSchema = z.array(ChapterModel)

  const i18n = getI18n(book.language);
  const {
    model
  } = book
  const [provider, modelName] = model.split("/");

  const parser = StructuredOutputParser.fromZodSchema(ChaptersSchema);
  const systemMsg = `${i18n.t("bookOutlinePrompt")}
      # General Instructions
        {prompt}
      # Format Instructions:
        {format_instructions}
      # Write with Language:{language}
    `
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", systemMsg],
    new MessagesPlaceholder("messages"),
  ]);

  const llm = LLMProvider.getModel(provider, {
    model: modelName,
    temperature: 0,
    maxRetries: 2
  });

  const chain = prompt.pipe(llm).pipe(new StringOutputParser());
  // const chain = prompt.pipe(llm).pipe(parser);

  const eventStream = await chain.stream({
    title: book.title,
    description: book.description,
    prompt: book.prompt,
    language: book.language,
    format_instructions: parser.getFormatInstructions(),
    messages
  });

  return eventStream
}

export async function fetchBookPrompt(
  book: z.infer<typeof FormSchema> & { id: string }
) {
  const [provider, modelName] = book.model.split("/");

  const llm = LLMProvider.getModel(provider, {
    model: modelName,
    temperature: 0,
    maxRetries: 2
  });

  const chain = RunnableSequence.from([
    {
      promptGenerator: async () => {
        return llm.invoke(getStandardBookPrompt(book));
      }
    },
    {
      contentGenerator: async (input) => {
        return llm.invoke(getBookPrompt(input.promptGenerator.content, book.language!));
      }
    },
    (input) => input.contentGenerator
  ]);

  const bookPrompt = await chain.invoke("");
  return bookPrompt.content.toString()
}

export async function createMessage(
  bookId: string,
  message: CreateMessage
) {
  const prisma = getPrisma();
  const book = await prisma.book.findUnique({
    where: { id: bookId },
    include: { messages: true },
  });
  if (!book) notFound();

  const positions = book.messages.map(m => m.position);
  const maxPosition = positions.length > 0 ? Math.max(...positions) : 0;

  const newMessage = await prisma.message.create({
    data: {
      role: message.role,
      content: message.content,
      position: maxPosition + 1,
      bookId,
    },
  });

  return newMessage;
}

export async function createBookOutline(
  bookId: string,
  chapters: ChapterInput[]
) {
  try {
    // Flatten the chapter hierarchy with position strings
    const flattenedChapters = flattenChaptersWithPosition(chapters);

    const updatedBook = await prisma.book.update({
      where: {
        id: bookId,
      },
      data: {
        chapters: {
          createMany: {
            data: flattenedChapters.map(({ children: _, ...chapter }) => chapter)
          }
        },
      },
      include: {
        chapters: true
      },
    });
    return updatedBook;
  } catch (updateError) {
    console.error("Error updating book with chapters:", updateError);
  }
}

export async function updateMessage(
  messageId: string,
  content: string,
) {
  const prisma = getPrisma();
  const mesage = await prisma.message.update({
    where: { id: messageId },
    data: {
      content
    }
  });
  return mesage;
}

export async function removeMessagesAfterMessageId(
  bookId: string,
  messageId: string,
) {
  const prisma = getPrisma();

  const targetMessage = await prisma.message.findUnique({
    where: { id: messageId },
    select: { position: true }
  });

  if (!targetMessage) {
    throw new Error('Message not found');
  }

  const result = await prisma.message.deleteMany({
    where: {
      bookId,
      position: {
        gt: targetMessage.position
      }
    }
  });

  return result;
}
