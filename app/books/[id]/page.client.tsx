"use client";

import Header from "@/components/Header";

import { Book, Chapter } from "@prisma/client";
import Content from "./components/content";
import { OutlineSheet } from "./components/outline-sheet";

export type BookWithChapters = Book & {
  chapters: Chapter[];
};

export default function PageClient({ book }: { book: BookWithChapters }) {
  return (
    <div className="flex gap-4 h-screen">
      <main className="flex flex-1 flex-col " >
        <Header>
          <span className="truncate text-sm font-medium text-foreground/80">
            {book.title}
          </span>
        </Header>
        <div className="flex-1 overflow-auto w-[1000px] mx-auto bg-secondary text-secondary-foreground">
          {book.chapters.map((chapter) => (
            <Content key={chapter.id} chapter={chapter} />
          ))}
        </div>
      </main >
      <div className="fixed right-16 bottom-16">
        <OutlineSheet book={book} />
      </div>
    </div>

  );
}