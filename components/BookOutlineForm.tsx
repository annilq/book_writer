"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardDescription, CardHeader, CardTitle } from "./ui/card"

export interface BookMeta {
  title: string
  description: string
}

export default function BookOutlineForm(props: { handleSubmit: (data: BookMeta) => Promise<any> }) {
  const [bookTitle, setBookTitle] = useState("")
  const [bookDescription, setBookDescription] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would typically send the data to your backend or API
    // For demonstration, we'll just set a mock outline
    // props.handleSubmit(e)
    props.handleSubmit({ title: bookTitle, description: bookDescription })
  }

  return (
    <Card className="mx-auto mt-4" >
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-center">Book Writer</CardTitle>
        <CardDescription className="font-bold text-center mb-8">Enter your book's title and description to Create Your Book Outlin</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-4 px-6 pb-6">
        <Input
          type="text"
          placeholder="Book Title"
          value={bookTitle}
          onChange={(e) => setBookTitle(e.target.value)}
          required
        />
        <Textarea
          placeholder="Brief book description"
          value={bookDescription}
          onChange={(e) => setBookDescription(e.target.value)}
          required
        />
        <Button type="submit" className="w-full">
          Generate Outline
        </Button>
      </form>
    </Card>
  )
}

