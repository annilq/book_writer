"use server";

import { Book } from "@prisma/client";
import { getI18n } from "@/utils/i18n/server";
import { CoreMessage, streamText } from "ai";
import { getAIModel } from "@/utils/ai_providers";

export async function fetchChapterContent(
  book: Book,
  messages: CoreMessage[] = []
) {
  const i18n = getI18n(book.language);
  const { model } = book;
  const [provider, modelName] = model.split("/");

  const systemPrompt = `${i18n.t("bookChapterPrompt")}
      # General Instructions
        ${book.prompt}
      # Outline
        ${JSON.stringify(book.chapters)}
      # Write with Language: ${book.language}
    `;

  const eventStream = await streamText({
    model: getAIModel(provider, modelName),
    messages: [
      { role: 'system' as const, content: systemPrompt },
      ...messages
    ],
    temperature: 0,
  });
  return eventStream;
}