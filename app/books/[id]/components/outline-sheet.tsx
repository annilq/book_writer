"use client"

import type React from "react"
import { Menu } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

import Outline from "./outline"
import { BookWithChapters } from "../page.client"
import { useState } from "react"
import { useTranslation } from "react-i18next"

export function OutlineSheet({ book }: { book: BookWithChapters }) {
  const [open, setOpen] = useState(false)
  const { t } = useTranslation()

  return (
    <Sheet open={open} onOpenChange={setOpen} >
      <SheetTrigger asChild>
        <Button
          size={"icon"}
          aria-label={t("viewChapters")}
          className="rounded-full bg-brand text-brand-foreground shadow-sm hover:bg-brand/90 focus-visible:ring-brand"
        >
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-96 overflow-auto">
        <SheetHeader className="mb-2">
          <SheetTitle>{book.title}</SheetTitle>
        </SheetHeader>
        <Outline book={book} onSelect={(chapter) => {
          const nodeEl = document.querySelector(`#chapter-${chapter.id}`)
          nodeEl?.scrollIntoView()
          setOpen(false)
        }} />
      </SheetContent>
    </Sheet>
  )
}


