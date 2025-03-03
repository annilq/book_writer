"use server";

import { getPrisma } from "@/utils/prisma";
import { notFound } from "next/navigation";
import LLMProvider from "@/utils/llms_provider";
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import { getBookPrompt, getStandardBookPrompt } from "@/utils/prompts";
import { extractJsonCodeFromMarkdown, flattenChaptersWithPosition } from "@/utils";
import { FormSchema } from "@/app/(main)/components/BookOutlineForm";
import { RunnableSequence } from "@langchain/core/runnables";
import { Book } from "@prisma/client";

const OUTLINE_PROMPT = `
  You are now a professional writer. Create a book outline based on the following information,Book Name: {title},Book description: {description}
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
  book: z.infer<typeof FormSchema> & { id: string }
) {
  const {
    id,
    title,
    model,
    description,
    language,
    categories,
  } = book
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
              {
                role: "system",
                content: bookPrompt,
                position: 0,
              },
              { role: "user", content: OUTLINE_PROMPT, position: 1 }
            ],
          },
        },
      },
      include: {
        messages: true,
      }
    });

    return updatedBook
    // const chapters: ChapterInput[] = await fetchBookOutline(updatedBook);

    // if (chapters.length === 0) {
    //   console.log("No valid chapters returned, returning book without chapters");
    //   return bookdata;
    // }

    // try {
    //   // Flatten the chapter hierarchy with position strings
    //   const flattenedChapters = flattenChaptersWithPosition(chapters);

    //   const updatedBook = await prisma.book.update({
    //     where: {
    //       id: bookdata.id,
    //     },
    //     data: {
    //       chapters: {
    //         createMany: {
    //           data: flattenedChapters.map(({ children: _, ...chapter }) => chapter)
    //         }
    //       },
    //       messages: {
    //         createMany: {
    //           data: [
    //             {
    //               role: "system",
    //               content: bookPrompt,
    //               position: 0,
    //             },
    //             { role: "user", content: OUTLINE_PROMPT, position: 1 },
    //           ],
    //         },
    //       },
    //     },
    //     include: {
    //       chapters: true
    //     },
    //   });
    //   return updatedBook;
    // } catch (updateError) {
    //   console.error("Error updating book with chapters:", updateError);
    //   return book;
    // }
  } catch (error) {
    console.error("Error in createBook:", error);
    return null;
  }
}

async function fetchBookOutline(
  book: Book,
) {
  const {
    model
  } = book
  const [provider, modelName] = model.split("/");

  const parser = StructuredOutputParser.fromZodSchema(ChaptersSchema);

  const prompt = PromptTemplate.fromTemplate(`${OUTLINE_PROMPT}
      # General Instructions
        {prompt}
      # Format Instructions:
        {format_instructions}
    `
  );

  const llm = LLMProvider.getModel(provider, {
    model: modelName,
    temperature: 0,
    maxRetries: 2
  });

  const chain = prompt.pipe(llm).pipe(parser);
  console.log(parser.getFormatInstructions());

  try {
    const rawOutline = await chain.invoke({
      title: book.title,
      description: book.description,
      prompt: book.prompt,
      format_instructions: parser.getFormatInstructions()
    });
    return rawOutline
  } catch (error: any) {
    const [extraData] = extractJsonCodeFromMarkdown(error.llmOutput)
    return extraData ? extraData : [];
  }
}

async function fetchBookPrompt(
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
