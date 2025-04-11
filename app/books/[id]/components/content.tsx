"use client";

import { Chapter } from "@prisma/client";
import Markdown from 'react-markdown'

export default function Content({ chapter }: { chapter: Chapter }) {
  return (
    <div className="px-4" id={`chapter-${chapter.id}`}>
      <Markdown>{chapter.content}</Markdown>
    </div>
  );
}