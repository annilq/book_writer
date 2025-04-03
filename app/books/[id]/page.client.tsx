"use client";

import BookHeader from "@/app/chats/[id]/components/chat-header";

import ThemeToggle from "@/components/ThemeToggle";
import { useTranslation } from "react-i18next";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { Book, Chapter } from "@prisma/client";
import Content from "./components/content";
import { OutlineSheet } from "./components/outline-sheet";

export type BookWithChapters = Book & {
  chapters: Chapter[];
};

export default function PageClient({ book }: { book: BookWithChapters }) {
  const { t } = useTranslation()

  return (
    <div className="flex gap-4 h-screen">
      <main className="flex flex-1 flex-col " >
        <BookHeader className="p-4">
          <div className="flex items-center flex-1 text-base">
            {book.title}
          </div>
          <div className="flex items-center gap-4 h-4">
            <Link href={"/"}>{t("home")}</Link>
            <Separator orientation="vertical" />
            <Link href={"/books"}>{t("bookshelf")}</Link>
            <Separator orientation="vertical" />
            <Link href={"/explore"}>{t("explore")}</Link>
            <Separator orientation="vertical" />
            <ThemeToggle />
          </div>
        </BookHeader>
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