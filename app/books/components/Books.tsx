"use client"

import { Spinner } from "@/components/spinner";
import { Book, STEP } from "@prisma/client";
import { BookOpen, Plus } from "lucide-react";
import Image from "next/image"
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type React from "react"
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import useSWR from "swr";
import { Badge } from "@/components/ui/badge";
import { filterBooks, parseBookshelfStatus } from "@/utils/book-filters";

export type BookshelfView = "grid" | "list"

function bookHref(bookId: string, step: STEP) {
  switch (step) {
    case "OUTLINE":
      return `/chats/${bookId}`
    case "CHAPTER":
      return `/content/${bookId}`
    case "COMPLETE":
      return `/books/${bookId}`
    default:
      return `/chats/${bookId}`
  }
}

function BookRow({ bookId, title, metadata, step }: { bookId: string; step: STEP; title: string; metadata: string }) {
  const statusLabel = useMemo(() => stepLabel(step), [step])

  return (
    <Link
      href={bookHref(bookId, step)}
      className="group flex items-center gap-4 rounded-lg border bg-card px-4 py-3 transition-all duration-200 hover:border-foreground/20 hover:shadow-sm"
    >
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="mt-0.5 truncate text-sm text-muted-foreground">{metadata}</p>
      </div>
      <Badge variant="secondary" className="shrink-0 border text-xs font-medium">
        {statusLabel}
      </Badge>
    </Link>
  )
}

function stepLabel(step: STEP) {
  switch (step) {
    case "OUTLINE": return "Draft";
    case "CHAPTER": return "Writing";
    case "COMPLETE": return "Published";
    default: return "Unknown";
  }
}

function BookCard({ bookId, title, metadata, step, thumbnail }: { bookId: string; step: STEP, title: string; metadata: string; thumbnail: string }) {

  const url = useMemo(() => bookHref(bookId, step), [bookId, step])
  const statusLabel = useMemo(() => stepLabel(step), [step]);

  return (
    <Link href={url} className="group block h-full">
      <div className="flex flex-col h-full rounded-lg border bg-card transition-all duration-200 hover:border-foreground/20 hover:shadow-sm">
        {/* Cover Image */}
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-t-lg bg-muted border-b">
          <Image
            src={thumbnail || "/placeholder.svg"}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm border shadow-sm text-xs font-medium">
              {statusLabel}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-4">
          <h3 className="font-semibold tracking-tight text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2 h-10 leading-relaxed">
            {metadata || "No description provided."}
          </p>
          
          <div className="mt-auto pt-4 flex items-center justify-between text-xs text-muted-foreground font-mono">
             <span>ID: {bookId.slice(0, 8)}</span>
             <span>{new Date().toLocaleDateString()}</span> {/* Ideally created_at */}
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function Books({ query = "", view = "grid" }: { query?: string; view?: BookshelfView }) {
  const { data: books, isLoading } = useSWR<Book[]>('/api/book')
  const { t } = useTranslation()
  const status = parseBookshelfStatus(useSearchParams().get("status"))

  const visible = useMemo(
    () => filterBooks(books ?? [], { status, query }),
    [books, status, query],
  )

  if (isLoading) {
    return (
        <div className="flex items-center justify-center h-64">
            <Spinner />
        </div>
    )
  }

  if (!books || books.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-muted/30 py-20 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-background shadow-sm">
          <BookOpen className="h-7 w-7 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="text-base font-medium">No books yet</p>
          <p className="mx-auto max-w-xs text-sm text-muted-foreground">
            Create your first AI-generated book — just give it a title and a short idea.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Create your first book
        </Link>
      </div>
    )
  }

  // The shelf has books, but the active filter/search hides them all —
  // say so rather than showing an empty grid.
  if (visible.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/30 py-16 text-center text-sm text-muted-foreground">
        {t("noBooksMatch")}
      </div>
    )
  }

  if (view === "list") {
    return (
      <div className="flex flex-col gap-2">
        {visible.map(book => (
          <BookRow
            key={book.id}
            title={book.title}
            step={book.step}
            bookId={book.id}
            metadata={book.description || ""}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {visible.map(book => (
        <BookCard 
            key={book.id} 
            title={book.title} 
            step={book.step} 
            bookId={book.id} 
            metadata={book.description || ""} 
            thumbnail={book.coverImage || "/placeholder.svg"} 
        />
      ))}
    </div>
  )
}
