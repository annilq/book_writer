import Spinner from "@/components/Spinner";
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
    <Link href={url} className="group relative overflow-hidden rounded-lg border bg-background">
      <div className="aspect-4/3 overflow-hidden">
        <Image
          src={thumbnail || "/placeholder.svg"}
          alt={title}
          width={400}
          height={300}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
      </div>
      <div className="p-4">
        <h3 className="font-medium text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500 truncate" title={metadata}>{metadata}</p>
      </div>
    </Link>
  )
}

export default function Books() {

  const { data: books, isLoading } = useSWR<Book[]>('/api/book')
  if (isLoading) {
    return <Spinner />
  }
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-6">
      {books?.map(book => <BookCard key={book.id} title={book.title} step={book.step} bookId={book.id} metadata={book.description} thumbnail={book.coverImage || "/placeholder.svg"} />)}
    </div>
  )
}