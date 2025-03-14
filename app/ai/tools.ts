import { tool as createTool } from 'ai';
import { z } from 'zod';

export const bookOutlineTool = createTool({
  description: 'convert markdown format book outline string to JSON format',
  parameters: z.object({
    bookOutlineMarkdown: z.string().describe('markdown format book outline string'),
  }),
  execute: async function ({ bookOutlineMarkdown }) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return { weather: 'Sunny', temperature: 75, location };
  },
});

export const tools = {
  bookOutlineTool: bookOutlineTool,
};