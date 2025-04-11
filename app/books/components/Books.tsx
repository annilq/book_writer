import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { Book, STEP } from "@prisma/client";
import Image from "next/image"
import Link from "next/link";
import type React from "react"
import { useMemo } from "react";
import useSWR from "swr";

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

  return (
    <div className="group rounded border bg-background flex flex-col gap-2 pb-2">
      <Link href={url} className="flex flex-col gap-2 pb-2 border-b">
        <div className="aspect-4/3 overflow-hidden">
          <Image
            src={thumbnail || "/placeholder.svg"}
            alt={title}
            width={400}
            height={300}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        </div>
        <div className="px-2">
          <div className="font-medium text-foreground">{title}</div>
          <div className="text-sm text-secondary-foreground truncate" title={metadata}>{metadata}</div>
        </div>
      </Link>
      <div className="flex gap-4 px-2">
        <Button className="rounded">状态</Button>
        <Button className="rounded">标签</Button>
        <Button className="rounded">公开</Button>
      </div>
    </div>

  )
}

export default function Books() {

  const { data: books, isLoading } = useSWR<Book[]>('/api/book')
  if (isLoading) {
    return <Spinner />
  }
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-4">
      {books?.map(book => <BookCard key={book.id} title={book.title} step={book.step} bookId={book.id} metadata={book.description} thumbnail={book.coverImage || "/placeholder.svg"} />)}
    </div>
  )
}