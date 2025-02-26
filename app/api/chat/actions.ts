"use server";

import { getPrisma } from "@/utils/prisma";
import { notFound } from "next/navigation";
import LLMProvider from "@/utils/llms_provider";
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";

const TEMPLATE = `
  You are now a professional writer, skilled in creating works in the {categories} fields.  Create a book outline based on the following information:
  Book Name: {title}
  Book description: {description}
  Coherence requirements:
    - Relevance to the context
    - Rationality of character actions
    - Smoothness of plot development
    - Keep the Emotional tone, Core theme, Writing style Consistency and Integrity
    - Return JSON response like this:{format_instructions}
`;

const Chapter = z.object({
  title: z.string().min(3),
  content: z.string().min(20),
  order: z.number(),
  bookId: z.string(),
  parentId: z.number().nullable().optional()
});

const ChaptersSchema = z.array(Chapter);

interface RecursiveChapter {
  title: string;
  content: string;
  order?: number;
  parent?: string;
  children?: RecursiveChapter[];
}

function flattenChapters(
  node: RecursiveChapter | null,
  bookId: string,
  parentId: number | null = null,
  order: number = 1,
  result: any[] = []
): [number, any[]] {
  if (!node) return [order, result];

  const chapter = {
    title: node.title,
    content: node.content || "No content provided",
    order: node.order || order,
    bookId: bookId,
    parentId: parentId
  };

  result.push(chapter);
  const currentIndex = result.length;

  if (node.children && Array.isArray(node.children)) {
    let childOrder = order + 1;
    for (const child of node.children) {
      const [nextOrder, _] = flattenChapters(child, bookId, currentIndex, childOrder, result);
      childOrder = nextOrder;
    }
    return [childOrder, result];
  }

  return [order + 1, result];
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

    const chapters = await fetchBookOutline(id, title, description, categories, provider, modelName);

    if (!chapters || !Array.isArray(chapters) || chapters.length === 0) {
      console.log("No valid chapters returned, returning book without chapters");
      return book;
    }

    try {
      const updatedBook = await prisma.book.update({
        where: {
          id: book.id,
        },
        data: {
          chapters: { createMany: { data: chapters } },
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

    if (Array.isArray(rawOutline)) {
      return rawOutline.map((chapter, index) => ({
        ...chapter,
        bookId,
        order: chapter.order || index + 1
      }));
    } else {
      console.log("Unexpected output format, attempting to recover");
      if (rawOutline && typeof rawOutline === 'object') {
        const [_, flattenedChapters] = flattenChapters(rawOutline as RecursiveChapter, bookId);
        return flattenedChapters;
      }
      return null;
    }
  } catch (error: any) {
    console.log("Error fetching book outline:", error);

    try {
      if (error.message && typeof error.output === 'string') {
        console.log("Attempting to recover from error output");
        try {
          const jsonData = JSON.parse(error.output);
          if (Array.isArray(jsonData)) {
            return jsonData.map((chapter, index) => ({
              ...chapter,
              bookId,
              order: chapter.order || index + 1
            }));
          }
        } catch (parseError) {
          console.log("Direct parsing failed, trying to extract JSON from text");
        }
        // try to extract JSON from code snippet
        const jsonMatch = error.output.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          try {
            const jsonData = JSON.parse(jsonMatch[1]);
            if (Array.isArray(jsonData)) {
              return jsonData.map((chapter, index) => ({
                ...chapter,
                bookId,
                order: chapter.order || index + 1
              }));
            } else {
              const [_, flattenedChapters] = flattenChapters(jsonData as RecursiveChapter, bookId);
              return flattenedChapters;
            }
          } catch (jsonError) {
            console.log("JSON parsing from code block failed:", jsonError);
          }
        }
        // try to find any JSON Array string
        const arrayMatch = error.output.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (arrayMatch) {
          try {
            const jsonData = JSON.parse(arrayMatch[0]);
            if (Array.isArray(jsonData)) {
              return jsonData.map((chapter, index) => ({
                ...chapter,
                bookId,
                order: chapter.order || index + 1
              }));
            }
          } catch (arrayError) {
            console.log("Array extraction failed:", arrayError);
          }
        }
      }
    } catch (recoveryError) {
      console.log("Recovery attempt failed:", recoveryError);
    }

    console.log("All recovery attempts failed, returning fallback structure");
    return [
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
