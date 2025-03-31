import dedent from "dedent";
import { FormSchema } from "@/app/(main)/components/BookOutlineForm";
import { z } from "zod";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { Book } from "@prisma/client";

export function chapterPrompt(curChapter: string, preChapter?: string) {
  if (preChapter) {
    return dedent`
    now you finished the Chapter:*${preChapter}*
    continue to finish this Chapter:*${curChapter}*
    `;
  }
  return dedent`
  finished the Chapter:*${preChapter}*
  `;
}

export function getStandardBookPrompt(book: z.infer<typeof FormSchema>) {
  const systemPrompt = dedent`
  You are a professional book creation consultant. your work is generate a comprehensive set of creative prompts for a book with follow book info 
  Book Title:${book.title}
  Book description: ${book.description}

  In the generation process, follow these steps and principles:

  Step 1: Type Analysis and Element Extraction
  
  Analyze the target book type and answer the following questions:
    1.	What is the core goal of this type of book?
    2.	What is the main value this type of book provides to the readers?
    3.	What are the 3-5 key elements that make up this type of book?
    4.	What unique writing techniques does this type of book require?
    5.	What do readers value most when reading this type of book?
  
  Step 2: Generate Standard Setting
  
  Based on the analysis above, define the following:
    1.	Content Scope: What content should be included and what should be excluded?
    2.	Writing Standards: Writing rules that must be followed
    3.	Style Requirements: Language characteristics, expression methods, emotional tone
    4.	Structure Design: Content organization methods, hierarchy arrangements
    5.	Unique Features: How should the uniqueness of this type of book be reflected?
  
  Step 3: Prompt Framework Construction
  
  Based on the first two steps, generate specific content for the following modules:
  
  [Basic Information]
    •	Book Type: ${book.categories}
    •	Target Audience: ${book.audience}
    •	Expected Outcome: [Goal to be achieved]
  
  [Core Requirements]
    •	Theme Control: [Theme-related requirements]
    •	Content Design: [Content organization requirements]
    •	Writing Standards: [Writing rules requirements]
    •	Style Positioning: [Style-related requirements]
  
  [Structural Guidelines]
    •	Overall Framework: [Framework design requirements]
    •	Chapter Arrangement: [Chapter organization requirements]
    •	Content Distribution: [Proportional requirements for each part]
    •	Logical Relationships: [Logical development requirements]
  
  [Expression Techniques]
    •	Narrative Style: [Narrative technique requirements]
    •	Language Use: [Language characteristics requirements]
    •	Detail Handling: [Detail presentation requirements]
    •	Emphasis: [Key point expression requirements]
  
  [Innovation Requirements]
    •	Innovation Directions: [Guidelines for innovation space]
    •	Degree of Innovation: [Requirements for innovation scale]
    •	Innovation Methods: [Suggestions for innovative methods]
  
  [Quality Standards]
    •	Completeness: [Completeness check standards]
    •	Consistency: [Consistency check standards]
    •	Professionalism: [Professionalism check standards]
    •	Innovation: [Innovation check standards]

  [Generate prompts]
    Integrate all the above elements to generate structured creative prompts, ensuring that:
    1.	Content Completeness: All necessary modules are covered
    2.	Logical Coherence: Clear relationships between parts
    3.	Operability: Requirements are specific and executable
    4.	Flexibility: Leave appropriate creative space
  
  Notes:
    1.	All requirements should be specific and executable
    2.	Maintain clarity and accuracy in language
    3.	Find a balance between consistency and flexibility
    4.	Leave enough room for creativity in the process
    5.	Only return the [Generate prompts] result, no other text
    
  Write with Language:${book.language}
    `;
  return systemPrompt
}

export function getOutlinePrompt(book: Book) {
  const ChapterModel: z.ZodType<any> = z.lazy(() => z.object({
    id: z.string().min(5),
    title: z.string().min(3),
    content: z.string().min(20),
    children: z.array(ChapterModel)
  }));

  const ChaptersSchema = z.array(ChapterModel);
  const parser = StructuredOutputParser.fromZodSchema(ChaptersSchema);
  const systemPrompt = dedent`
 You are now a professional writer. You can create a book outline based on the information the user provides.
      # General Instructions
        ${book.prompt}
      # Format Instructions:
        ${parser.getFormatInstructions()}
      # Write with Language: ${book.language}
    `;
  return systemPrompt
}


