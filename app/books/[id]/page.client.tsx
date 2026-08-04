"use client";

import BookHeader from "@/app/chats/[id]/components/chat-header";

import ThemeToggle from "@/components/ThemeToggle";
import { useTranslation } from "react-i18next";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { Book, Chapter } from "@prisma/client";
import Content from "./components/content";
import { OutlineSheet } from "./components/outline-sheet";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export type BookWithChapters = Book & {
  chapters: Chapter[];
};

export default function PageClient({ book }: { book: BookWithChapters }) {
  const { t } = useTranslation()

  const exportBook = () => {
    const md = [
      `# ${book.title}`,
      book.description ? `\n> ${book.description}\n` : "",
      ...book.chapters
        .filter((c) => c.content || c.title)
        .map((c) => {
          const heading =
            c.position && c.position !== "0" ? `## ${c.position} ${c.title}` : `## ${c.title}`;
          return `\n${heading}\n\n${c.content ?? ""}`;
        }),
    ].join("\n");
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${book.title || "book"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex gap-4 h-screen">
      <main className="flex flex-1 flex-col" >
        <BookHeader className="p-4">
          <div className="flex items-center flex-1 text-base gap-2 min-w-0">
            <Link href={"/books"} className="shrink-0 hover:text-brand transition-colors">{t("bookshelf")}</Link>
            <Separator orientation="vertical" />
            <span className="truncate">{book.title}</span>
          </div>
          <div className="flex items-center gap-4 h-4 shrink-0">
            <Link href={"/"}>{t("home")}</Link>
            <Separator orientation="vertical" />
            <Link href={"/explore"}>{t("explore")}</Link>
            <Separator orientation="vertical" />
            <Button variant="ghost" size="sm" onClick={exportBook} className="h-8 gap-1.5 text-brand hover:text-brand hover:bg-brand/10">
              <Download className="h-4 w-4" />
              {t("exportBook")}
            </Button>
            <ThemeToggle />
          </div>
        </BookHeader>
        <div className="flex-1 overflow-auto">
          <div className="w-full max-w-3xl mx-auto px-6 py-10">
            {book.chapters.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-24">
                <h1 className="text-lg font-semibold tracking-tight">{book.title}</h1>
                <p className="mt-2 max-w-sm text-muted-foreground">{t("emptyBook")}</p>
                <Link
                  href={`/books/${book.id}/agent`}
                  className="mt-6 inline-flex items-center justify-center rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand/90"
                >
                  {t("generateChat")}
                </Link>
              </div>
            ) : (
              <div className="prose prose-neutral dark:prose-invert max-w-none">
                <h1 className="mb-8">{book.title}</h1>
                {book.chapters.map((chapter) => (
                  <Content key={chapter.id} chapter={chapter} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main >
      <div className="fixed right-16 bottom-16">
        <OutlineSheet book={book} />
      </div>
    </div>
  );
}
