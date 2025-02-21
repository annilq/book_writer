"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { SUGGESTED_PROMPTS } from "@/utils/constants"
import { useTranslation } from "react-i18next"

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
  const [bookName, setBookTitle] = useState("")
  const [bookDescription, setBookDescription] = useState("")
  const { t } = useTranslation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would typically send the data to your backend or API
    // For demonstration, we'll just set a mock outline
    // props.handleSubmit(e)
    props.handleSubmit({ title: bookName, description: bookDescription })
  }

  return (
    <Card className="mx-auto w-1/4 min-w-fit max-w-2xl mt-8" >
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-center">{t("appName")}</CardTitle>
        <CardDescription className="font-bold text-center mb-8">{t("appTip")}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-4 px-6 pb-6">
        <Input
          type="text"
          placeholder={t("bookName")}
          value={bookName}
          onChange={(e) => setBookTitle(e.target.value)}
          required
        />
        <Textarea
          placeholder={t("bookDesc")}
          value={bookDescription}
          rows={8}
          onChange={(e) => setBookDescription(e.target.value)}
          required
        />
        <Button type="submit" className="w-full">
          {t("generateButton")}
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

