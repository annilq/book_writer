import { Spinner } from "@/components/spinner";
import { Book, STEP } from "@prisma/client";
import { BookOpen, Plus } from "lucide-react";
import Image from "next/image"
import Link from "next/link";
import type React from "react"
import { useMemo } from "react";
import useSWR from "swr";
import { Badge } from "@/components/ui/badge";

function BookCard({ bookId, title, metadata, step, thumbnail }: { bookId: string; step: STEP, title: string; metadata: string; thumbnail: string }) {

  const url = useMemo(() => {
    let url = `/chats/${bookId}`
    switch (step) {
      case "OUTLINE":
        url = `/chats/${bookId}`
        break;
      case "CHAPTER":
        url = `/content/${bookId}`
        break;
      case "COMPLETE":
        url = `/books/${bookId}`
        break;
      default:
        break;
    }
    return url
  }, [bookId, step])

  const status = useMemo(() => {
    switch (step) {
      case "OUTLINE":
        return { label: "Draft", cls: "bg-slate-500/10 text-slate-600 border-slate-500/20 dark:bg-slate-400/10 dark:text-slate-300 dark:border-slate-400/20" };
      case "CHAPTER":
        return { label: "Writing", cls: "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:bg-amber-400/10 dark:text-amber-300 dark:border-amber-400/20" };
      case "COMPLETE":
        return { label: "Published", cls: "bg-success/10 text-success border-success/20" };
      default:
        return { label: "Unknown", cls: "bg-muted text-muted-foreground border-border" };
    }
  }, [step]);

  return (
    <Link href={url} className="group block h-full">
      <div className="flex flex-col h-full overflow-hidden rounded-lg border border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md hover:shadow-brand/5">
        {/* Cover Image */}
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-t-lg bg-gradient-to-br from-brand/5 to-muted border-b">
          <Image
            src={thumbnail || "/placeholder.svg"}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent" />
          <div className="absolute top-2 right-2">
            <Badge className={`backdrop-blur-sm shadow-sm text-xs font-medium ${status.cls}`}>
              {status.label}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-4">
          <h3 className="font-semibold tracking-tight text-foreground line-clamp-1 transition-colors group-hover:text-brand">
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

export default function Books({ publicOnly = false, step }: { publicOnly?: boolean; step?: string }) {
  const { data: books, isLoading } = useSWR<Book[]>('/api/book')
  const visible = (books ?? []).filter((b) => {
    if (publicOnly && b.step !== "COMPLETE") return false
    if (step && b.step !== step) return false
    return true
  })
  
  if (isLoading) {
    return (
        <div className="flex items-center justify-center h-64">
            <Spinner />
        </div>
    )
  }

  if (visible.length === 0) {
    if (publicOnly) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-muted/30 py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-background shadow-sm">
            <BookOpen className="h-7 w-7 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-medium">No published books yet</p>
            <p className="mx-auto max-w-xs text-sm text-muted-foreground">
              Published books from the community will appear here once they go live.
            </p>
          </div>
        </div>
      )
    }
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
