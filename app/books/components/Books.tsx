import { Spinner } from "@/components/spinner";
import { Book, STEP } from "@prisma/client";
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

  const statusLabel = useMemo(() => {
    switch (step) {
      case "OUTLINE": return "Draft";
      case "CHAPTER": return "Writing";
      case "COMPLETE": return "Published";
      default: return "Unknown";
    }
  }, [step]);

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

export default function Books() {
  const { data: books, isLoading } = useSWR<Book[]>('/api/book')
  
  if (isLoading) {
    return (
        <div className="flex items-center justify-center h-64">
            <Spinner />
        </div>
    )
  }

  if (!books || books.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center h-64 bg-muted/50">
            <p className="text-muted-foreground text-sm">No books created yet.</p>
        </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {books.map(book => (
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
