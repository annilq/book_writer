"use server";

import { getPrisma } from "@/utils/prisma";
import { notFound } from "next/navigation";
import LLMProvider from "@/utils/llms_provider";
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import { bookArchitectPrompt, chapterPrompt } from "@/utils/prompts";
import { extractJsonCodeFromMarkdown, flattenChaptersWithPosition } from "@/utils";

const TEMPLATE = `
  You are now a professional writer, skilled in creating works in the {categories} fields.  Create a book outline based on the following information:
  Book Name: {title}
  Book description: {description}
  Coherence requirements:
    - Relevance to the context
    - Rationality of character actions
    - Smoothness of plot development
    - Keep the Emotional tone, Core theme, Writing style Consistency and Integrity
  Format Instructions:
  {format_instructions}
`;

const ChapterModel: z.ZodType<any> = z.lazy(() => z.object({
  title: z.string().min(3),
  content: z.string().min(20),
  children: z.array(ChapterModel)
}));

const ChaptersSchema = z.array(ChapterModel)

export interface ChapterInput {
  title: string;
  content: string;
  position: string;
  children?: ChapterInput[];
}


export async function createBook(
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
  try {
    const [provider, modelName] = model.split("/");
    if (!provider || !modelName) {
      console.error("Invalid model format. Expected 'provider/model'");
      return null;
    }

    const prisma = getPrisma();

    const book = await prisma.book.create({
      data: {
        id,
        model,
        title,
        categories: {
          connect: categories.map(name => ({ name }))
        },
        description
      },
    });

    const chapters: ChapterInput[] = await fetchBookOutline(id, title, description, categories, provider, modelName);

    if (chapters.length === 0) {
      console.log("No valid chapters returned, returning book without chapters");
      return book;
    }

    try {
      // Flatten the chapter hierarchy with position strings
      const flattenedChapters = flattenChaptersWithPosition(chapters);

      const updatedBook = await prisma.book.update({
        where: {
          id: book.id,
        },
        data: {
          chapters: {
            createMany: {
              data: flattenedChapters.map(({ children: _, ...chapter }) => chapter)
            }
          },
          messages: {
            createMany: {
              data: [
                {
                  role: "system",
                  content: bookArchitectPrompt(book, flattenedChapters.map(c => c.title)),
                  position: 0,
                },
                { role: "user", content: chapterPrompt(flattenedChapters[0].title), position: 1 },
              ],
            },
          },
        },
        include: {
          chapters: true
        },
      });
      return updatedBook;
    } catch (updateError) {
      console.error("Error updating book with chapters:", updateError);
      return book;
    }
  } catch (error) {
    console.error("Error in createBook:", error);
    return null;
  }
}

async function fetchBookOutline(
  bookId: string,
  title: string,
  description: string,
  categories: string[],
  provider: string,
  modelName: string
) {
  const parser = StructuredOutputParser.fromZodSchema(ChaptersSchema);

  const prompt = PromptTemplate.fromTemplate(TEMPLATE);

  const llm = LLMProvider.getModel(provider, {
    model: modelName,
    temperature: 0,
    maxRetries: 2
  });

  const chain = prompt.pipe(llm).pipe(parser);
  console.log(parser.getFormatInstructions());

  try {
    const rawOutline = await chain.invoke({
      title,
      description,
      categories,
      format_instructions: parser.getFormatInstructions()
    });
    return rawOutline
  } catch (error: any) {
    const [extraData] = extractJsonCodeFromMarkdown(error.llmOutput)
    return extraData ? extraData : [
      {
        title: title,
        content: `Introduction to ${title}`,
        order: 1,
        bookId,
        parentId: null
      },
      {
        title: "Chapter 1",
        content: description.length > 50 ? description : `First chapter of ${title}`,
        order: 2,
        bookId,
        parentId: null
      }
    ];
  }
}

export async function createMessage(
  bookId: string,
  text: string,
  role: "assistant" | "user",
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
      role,
      content: text,
      position: maxPosition + 1,
      bookId,
    },
  });

  return newMessage;
}
