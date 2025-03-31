"use client";

import { Chapter } from "@prisma/client";
import { ForwardRefEditor } from "@/components/Editor/ForwardRefEditor";

export default function Content({ chapter }: { chapter: Chapter }) {
  return (
    <div className="px-4" id={`chapter-${chapter.id}`}>
      <ForwardRefEditor markdown={chapter.content} readOnly />
    </div>
  );
}