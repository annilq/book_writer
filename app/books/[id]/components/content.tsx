"use client";

import { Chapter } from "@prisma/client";
import Markdown from 'react-markdown'
import remarkGfm from "remark-gfm";

export default function Content({ chapter }: { chapter: Chapter }) {
  return (
    <div className="px-4" id={`chapter-${chapter.id}`}>
      <Markdown remarkPlugins={[remarkGfm]}>{chapter.content}</Markdown>
    </div>
  );
}