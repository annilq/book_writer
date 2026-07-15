import { z } from "zod";
import { extractJsonCodeFromMarkdown, type ChapterInput } from "@/utils";

export const ChapterModel: z.ZodType<any> = z.lazy(() =>
  z.object({
    id: z.string().min(5),
    title: z.string().min(3),
    description: z.string().min(20),
    children: z.array(ChapterModel),
  })
);

export const ChaptersSchema = z.array(ChapterModel);

function toChapterInput(nodes: any[]): ChapterInput[] {
  return nodes.map((node) => ({
    title: node.title,
    description: node.description,
    position: "",
    children:
      node.children && node.children.length ? toChapterInput(node.children) : undefined,
  }));
}

export function parseOutlineToChapterInputs(outlineText: string): ChapterInput[] {
  const blocks = extractJsonCodeFromMarkdown(outlineText);
  if (!blocks.length) throw new Error("No JSON outline found in model output");
  const parsed = ChaptersSchema.parse(blocks[0]);
  return toChapterInput(parsed);
}
