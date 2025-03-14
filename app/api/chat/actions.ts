"use server";

import { getPrisma, prisma } from "@/utils/prisma";
import { notFound } from "next/navigation";
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { z } from "zod";
import { getBookPrompt, getStandardBookPrompt } from "@/utils/prompts";
import { ChapterInput, flattenChaptersWithPosition } from "@/utils";
import { FormSchema } from "@/app/(main)/components/BookOutlineForm";
import { Book } from "@prisma/client";
import { getI18n } from "@/utils/i18n/server";
import { CoreMessage, CreateMessage, generateText, streamText } from "ai";
import { getAIModel } from "@/utils/ai_providers";
import { parseBookOutline } from "@/utils/ai_providers/tools/bookline";

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
  messages: CoreMessage[] = []
) {
  const i18n = getI18n(book.language);
  const { model } = book;
  const [provider, modelName] = model.split("/");

  const ChapterModel: z.ZodType<any> = z.lazy(() => z.object({
    id: z.string().min(5),
    title: z.string().min(3),
    content: z.string().min(20),
    children: z.array(ChapterModel)
  }));

  const ChaptersSchema = z.array(ChapterModel);
  const parser = StructuredOutputParser.fromZodSchema(ChaptersSchema);

  const systemPrompt = `${i18n.t("bookOutlinePrompt")}
      # General Instructions
        ${book.prompt}
      # Format Instructions:
        ${parser.getFormatInstructions()}
      # Write with Language: ${book.language}
    `;

  const eventStream = await streamText({
    model: getAIModel(provider, modelName),
    messages: [
      { role: 'system' as const, content: systemPrompt },
      ...messages
    ],
    temperature: 0,
    // tools: {
    //   parseBookOutline
    // },
    // maxSteps: 5
  });
  return eventStream;
}

export async function fetchBookPrompt(
  book: z.infer<typeof FormSchema> & { id: string }
) {
  const [provider, modelName] = book.model.split("/");

  const standardBookPrompt = await generateText({
    model: getAIModel(provider, modelName),
    prompt: getStandardBookPrompt(book),
  });

  const prompt = await generateText({
    model: getAIModel(provider, modelName),
    prompt: getBookPrompt(standardBookPrompt.text, book.language!),
  });

  return prompt.text
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
