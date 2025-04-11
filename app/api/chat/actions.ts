"use server";

import { getPrisma, prisma } from "@/utils/prisma";
import { notFound } from "next/navigation";
import { z } from "zod";
import { getOutlinePrompt, getStandardBookPrompt } from "@/utils/prompts";
import { ChapterInput, flattenChaptersWithPosition } from "@/utils";
import { FormSchema } from "@/app/(main)/components/BookOutlineForm";
import { Book, Prisma } from "@prisma/client";
import { getI18n } from "@/utils/i18n/server";
import { CoreMessage, CreateMessage, generateText, streamText } from "ai";
import { getAIModel } from "@/utils/ai_providers";

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
        step: "OUTLINE",
        prompt: bookPrompt,
        messages: {
          createMany: {
            data: [
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

export async function fetchBookPrompt(
  book: z.infer<typeof FormSchema> & { id: string }
) {
  const [provider, modelName] = book.model.split("/");

  const standardBookPrompt = await generateText({
    model: getAIModel(provider, modelName),
    prompt: getStandardBookPrompt(book),
  });

  return standardBookPrompt.text
}

export async function fetchBookOutline(
  model: string,
  book: Book,
  messages: CoreMessage[] = []
) {

  const [provider, modelName] = model.split("/");
  const outlinePrompt = getOutlinePrompt(book);

  const eventStream = streamText({
    model: getAIModel(provider, modelName),
    messages: [
      { role: 'system' as const, content: outlinePrompt },
      ...messages
    ],
    temperature: 0,
    // tools: {
    //   parseBookOutline
    // },
    // maxSteps: 5
    onStepFinish: (data) => {
      // console.log(data);
    },
    onFinish(result) {
      if (result.text) {
        const content = result.text;
        const parts = result.response.messages[0].content
        createMessage(book.id!, { role: "assistant", content: content, parts } as CreateMessage);
      }
    },
  });
  return eventStream;
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
      parts: {
        createMany: {
          data: (message.parts ? message.parts : [{ type: "text", text: message.content }])! as unknown as Prisma.MessagePartCreateInput[]
        }
      }
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

    // Use transaction to ensure atomicity with increased timeout
    const updatedBook = await prisma.$transaction(async (tx) => {
      // Create chapters first
      const bookWithChapters = await tx.book.update({
        where: {
          id: bookId,
        },
        data: {
          step: "CHAPTER",
          chapters: {
            createMany: {
              data: flattenedChapters.map(({ children: _, ...chapter }) => chapter)
            }
          },
        },
        include: {
          chapters: {
            where: { leaf: true },
            orderBy: {
              position: 'asc'
            },
            take: 1
          }
        }
      });

      // Get the first leaf chapter from the included chapters
      const firstLeafChapter = bookWithChapters.chapters[0];

      // Update the book with the first chapter's id if we have chapters
      if (firstLeafChapter) {
        return await tx.book.update({
          where: { id: bookId },
          data: {
            currentChapterId: firstLeafChapter.id
          },
          include: {
            chapters: true
          }
        });
      }

      return bookWithChapters;
    }, {
      timeout: 10000 // Increase timeout to 10 seconds
    });

    return updatedBook;
  } catch (error) {
    console.error("Error in createBookOutline transaction:", error);
    throw error;
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
export async function removeChapterMessagesAfterMessageId(
  chapterId: number,
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
      chapterId,
      position: {
        gt: targetMessage.position
      }
    }
  });

  return result;
}
