import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Chapter } from "@prisma/client";

export default function Content({ chapter }: { chapter: Chapter }) {
  return (
    <section
      id={`chapter-${chapter.id}`}
      data-chapter={chapter.id}
      className="scroll-mt-28 py-8 first:pt-0"
    >
      <div className="mb-4 flex items-baseline gap-3">
        <span className="font-mono text-xs font-medium text-brand/70">
          {chapter.position}
        </span>
        <h2 className="font-serif text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {chapter.title}
        </h2>
      </div>
      <div className="markdown">
        <Markdown remarkPlugins={[remarkGfm]}>{chapter.content}</Markdown>
      </div>
    </section>
  );
}
