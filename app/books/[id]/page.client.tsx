"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Book, Chapter } from "@prisma/client";
import Header from "@/components/Header";
import { BookOpen, Library, ListTree } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import Content from "./components/content";
import OutlineSheet from "./components/outline-sheet";
import { buildToc, type TocNode } from "./components/toc";

export type BookWithChapters = Book & {
  chapters: Chapter[];
};

export default function PageClient({ book }: { book: BookWithChapters }) {
  const toc = useMemo(() => buildToc(book), [book]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [activeId, setActiveId] = useState<number | null>(
    book.currentChapterId ?? book.chapters[0]?.id ?? null
  );

  // Reading progress bar
  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    setProgress(max > 0 ? (el.scrollTop / max) * 100 : 0);
  };

  // Active chapter tracking
  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const sections = root.querySelectorAll<HTMLElement>("section[data-chapter]");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(Number(entry.target.getAttribute("data-chapter")));
          }
        }
      },
      { root, rootMargin: "0px 0px -68% 0px", threshold: 0 }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [book.chapters]);

  const scrollTo = (id: number) => {
    document
      .getElementById(`chapter-${id}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const completed = book.chapters.length;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Left rail: persistent table of contents */}
      <aside className="hidden w-72 shrink-0 flex-col border-r border-border bg-muted/30 lg:flex">
        <div className="flex items-center gap-2 border-b border-border px-5 py-4">
          <BookOpen className="h-4 w-4 text-brand" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Contents
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <TocList nodes={toc} activeId={activeId} onSelect={scrollTo} />
        </nav>

        <div className="border-t border-border p-4">
          <Link
            href="/books"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-brand"
          >
            <Library className="h-4 w-4" />
            Back to bookshelf
          </Link>
        </div>
      </aside>

      {/* Center: reading column */}
      <div className="relative flex flex-1 flex-col overflow-hidden">
        {/* Reading progress */}
        <div className="absolute inset-x-0 top-0 z-20 h-0.5 bg-transparent">
          <div
            className="h-full bg-brand transition-[width] duration-150 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <Header>
          <div className="flex min-w-0 flex-1 items-center gap-2 pl-1">
            <span className="h-4 w-1 shrink-0 rounded-full bg-brand" />
            <span className="truncate text-sm font-medium text-foreground/80">
              {book.title}
            </span>
          </div>
          <span className="lg:hidden">
            <OutlineSheet book={book} />
          </span>
        </Header>

        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="flex-1 overflow-y-auto scroll-smooth"
        >
          <article className="mx-auto max-w-3xl px-6 pb-24 pt-10 sm:px-10">
            {/* Book hero */}
            <header className="mb-12 border-b border-border pb-10">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                {book.coverImage ? (
                  <Image
                    src={book.coverImage}
                    alt={book.title}
                    width={120}
                    height={160}
                    className="w-28 shrink-0 rounded-lg border border-border object-cover shadow-sm"
                  />
                ) : (
                  <div className="flex w-28 shrink-0 items-center justify-center rounded-lg border border-border bg-gradient-to-br from-brand/5 to-muted text-muted-foreground">
                    <BookOpen className="h-8 w-8" />
                  </div>
                )}
                <div className="min-w-0">
                  <h1 className="font-serif text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
                    {book.title}
                  </h1>
                  {book.description && (
                    <p className="mt-3 font-serif text-base leading-relaxed text-muted-foreground">
                      {book.description}
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {book.categories?.map((c) => (
                      <span
                        key={c.id}
                        className="rounded-full border border-brand/20 bg-brand/5 px-2.5 py-1 font-medium text-brand"
                      >
                        {c.name}
                      </span>
                    ))}
                    {book.language && (
                      <span className="rounded-full bg-muted px-2.5 py-1 uppercase">
                        {book.language}
                      </span>
                    )}
                    <span className="rounded-full bg-muted px-2.5 py-1">
                      {completed} chapters
                    </span>
                  </div>
                </div>
              </div>
            </header>

            {book.chapters.map((chapter) => (
              <Content key={chapter.id} chapter={chapter} />
            ))}

            <div className="mt-16 flex flex-col items-center gap-2 text-muted-foreground">
              <div className="h-px w-12 bg-border" />
              <span className="font-serif text-sm italic">The End</span>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}

function TocList({
  nodes,
  activeId,
  onSelect,
  depth = 0,
}: {
  nodes: TocNode[];
  activeId: number | null;
  onSelect: (id: number) => void;
  depth?: number;
}) {
  return (
    <ul className={depth === 0 ? "space-y-0.5" : "mt-0.5 space-y-0.5 border-l border-border/60 pl-3"}>
      {nodes.map((node) => {
        const active = node.id === activeId;
        return (
          <li key={node.id}>
            <button
              onClick={() => onSelect(node.id)}
              className={[
                "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm transition-colors",
                active
                  ? "bg-brand/10 font-medium text-brand"
                  : "text-muted-foreground hover:bg-brand/5 hover:text-foreground",
              ].join(" ")}
            >
              {!node.isInternal && (
                <span className="font-mono text-[10px] text-brand/60">
                  {node.position}
                </span>
              )}
              <span className="truncate">{node.title}</span>
            </button>
            {node.children.length > 0 && (
              <TocList
                nodes={node.children}
                activeId={activeId}
                onSelect={onSelect}
                depth={depth + 1}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}
