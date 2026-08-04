"use client";

import { Chapter } from "@prisma/client";
import Markdown from 'react-markdown'
import remarkGfm from "remark-gfm";

export default function Content({ chapter }: { chapter: Chapter }) {
  if (!chapter.title && !chapter.content) return null;
  const showPosition = !!chapter.position && chapter.position !== "0";
  return (
    <section id={`chapter-${chapter.id}`} className="scroll-mt-24 border-b border-border/50 pb-10 last:border-0">
      {chapter.title && (
        <h2 className="group flex flex-wrap items-baseline gap-x-3 gap-y-1">
          {showPosition && (
            <span className="font-mono text-sm font-normal tabular-nums text-brand">{chapter.position}</span>
          )}
          <span>{chapter.title}</span>
        </h2>
      )}
      {chapter.content ? (
        <Markdown remarkPlugins={[remarkGfm]}>{chapter.content}</Markdown>
      ) : null}
    </section>
  );
}
