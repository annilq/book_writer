"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import BookOutlineForm from "@/components/BookOutlineForm"

export default function Home() {
  const [bookTitle, setBookTitle] = useState("")
  const [bookDescription, setBookDescription] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // This would call an API route to generate the outline using the AI SDK
    // For now, we'll just set a dummy outline
    router.push(
      `/create?title=${encodeURIComponent(bookTitle)}&description=${encodeURIComponent(bookDescription)}`,
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <h1 className="text-6xl font-bold">
          Welcome toAI Book Writer
        </h1>
        <p className="mt-3 text-2xl">Create your next masterpiece with the help of AI</p>
        <BookOutlineForm handleSubmit={handleSubmit} />
      </main>
    </div>
  )
}