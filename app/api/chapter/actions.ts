"use server";

import { getI18n } from "@/utils/i18n/server";
import { streamText, convertToModelMessages, UIMessage } from "ai";
import { getAIModel } from "@/utils/ai_providers";
import { getPrisma } from "@/utils/prisma";
import { cache } from "react";
import { BookWithChapters } from "@/app/books/[id]/page.client";
import { Message, Prisma } from "@prisma/client";
import { getMessageText, uiMessagePartsToPrismaParts } from "@/utils";

export type MessageWithParts = Message & {
  parts: Prisma.MessagePartCreateInput[];
};

export async function fetchChapterContent(
  chapterId: number,
  model: string,
  book: BookWithChapters,
  messages: UIMessage[] = []
) {
  const i18n = getI18n(book.language);
  const [provider, modelName] = model.split("/");

  const systemPrompt = `${i18n.t("bookChapterPrompt")}
      # General Instructions
        ${book.prompt}
      # Outline
        ${JSON.stringify(book.chapters)}
      # Write with Language: ${book.language}
    `;

  const modelMessages = await convertToModelMessages(messages);
  const eventStream = streamText({
    model: getAIModel(provider, modelName),
    messages: [
      { role: 'system' as const, content: systemPrompt },
      ...modelMessages
    ],
    maxSteps: 5,
    temperature: 0,
    onFinish(result) {
      if (result.text) {
        const content = result.text;
        createChapterMessage(chapterId, {
          role: "assistant",
          content,
          parts: [{ type: "text", text: content }]
        });
      }
    },
  });
  return eventStream;
}

export async function createChapterMessage(
  chapterId: number,
  message: UIMessage
) {
  const prisma = getPrisma();
  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    include: { messages: true },
  });

  const positions = chapter!.messages.map(m => m.position);
  const maxPosition = positions.length > 0 ? Math.max(...positions) : 0;

  const newMessage = await prisma.message.create({
    data: {
      role: message.role,
      content: getMessageText(message),
      position: maxPosition + 1,
      chapterId,
      parts: {
        createMany: {
          data: uiMessagePartsToPrismaParts(message.parts)
        }
      }
    },
    include: {
      parts: true
    }
  });
  return newMessage;
}

export const clearMessageOfChapter = cache(async (id: number) => {
  const prisma = getPrisma();
  return await prisma.message.deleteMany({
    where: { chapterId: id },
  });
});

export const getMessageOfChapter = cache(async (id: number) => {
  const prisma = getPrisma();
  return await prisma.message.findMany({
    where: { chapterId: id },
    include: { parts: true }
  });
});

export const getChapterById = cache(async (id: number) => {
  const prisma = getPrisma();
  return await prisma.chapter.findFirst({
    where: { id },
    include: { messages: { orderBy: { position: "asc" } } },
  });
});

export const saveChapterContent = cache(async (id: number, content: string) => {
  const prisma = getPrisma();
  const chapter = await prisma.chapter.update({
    where: { id },
    data: { content }
  });

  const book = await prisma.book.findFirst({
    where: { id: chapter.bookId },
  });

  const nextLeafChapter = await prisma.chapter.findFirst({
    where: {
      bookId: book!.id,
      leaf: true,
      id: {
        gt: book!.currentChapterId || 0
      }
    },
    orderBy: {
      id: 'asc'
    }
  });

  if (chapter) {
    if (nextLeafChapter?.id) {
      return await prisma.book.update({
        where: { id: chapter.bookId },
        data: {
          currentChapterId: nextLeafChapter.id,
        }
      })
    } else {
      return await prisma.book.update({
        where: { id: chapter.bookId },
        data: {
          step: "COMPLETE"
        }
      })
    }
  }
});
