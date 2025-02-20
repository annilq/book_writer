"use client";

import { useState } from "react"
import { useRouter } from "next/navigation"
import BookOutlineForm, { BookMeta } from "@/components/BookOutlineForm"

export default function Home() {
  const router = useRouter()

  const handleSubmit = async (data: BookMeta) => {
    // This would call an API route to generate the outline using the AI SDK
    // For now, we'll just set a dummy outline
    router.push(
      `/create?title=${encodeURIComponent(data.title)}&description=${encodeURIComponent(data.title)}`,
    )
  }

  return (
    <div className="absolute inset-0 overflow-auto flex flex-col items-center">
      <main className="flex flex-col items-center justify-center w-full flex-1 text-center">
        <h1 className="text-6xl font-bold">
          Welcome to AI Book Writer
        </h1>
        <p className="mt-3 text-2xl">Create your next masterpiece with the help of AI</p>
        <BookOutlineForm handleSubmit={handleSubmit} />
      </main>
    </div>
  )
}