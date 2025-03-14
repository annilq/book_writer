import { z } from "zod";

export const parseBookOutline = {
  description: 'parse markdown Book Outline string to JSON format',
  parameters: z.object({
    bookoutlinestring: z.string().describe('The markdown string of a book outline'),
  }),
}