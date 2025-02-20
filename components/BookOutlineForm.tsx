"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { SUGGESTED_PROMPTS } from "@/utils/constants"

export interface BookMeta {
  title: string
  description: string
}

function Example(props: { handleSubmit: (data: BookMeta) => void }) {


  return (
    <div className="px-6 pb-6 flex w-full flex-wrap justify-center gap-3">
      {SUGGESTED_PROMPTS.map((v) => (
        <button
          key={v.title}
          type="button"
          onClick={() => props.handleSubmit(v)}
          className="rounded bg-secondary px-2.5 py-1.5 text-xs hover:outline hover:outline-1"
        >
          {v.title}
        </button>
      ))}
    </div>
  )
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
    <Card className="mx-auto w-1/4 min-w-fit max-w-2xl mt-8" >
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-center">Book Writer</CardTitle>
        <CardDescription className="font-bold text-center mb-8">Enter your book's title and description to Create Your Book Outline</CardDescription>
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
          rows={5}
          onChange={(e) => setBookDescription(e.target.value)}
          required
        />
        <Button type="submit" className="w-full">
          Generate Outline
        </Button>
      </form>
      <Example
        handleSubmit={(data) => {
          setBookTitle(data.title)
          setBookDescription(data.description)
        }} />
    </Card>
  )
}

