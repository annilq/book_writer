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

export function OutlineSheet({ book }: { book: BookWithChapters }) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen} >
      <SheetTrigger asChild>
        <Button size={"icon"} className="rounded-full" > <Menu /></Button>
      </SheetTrigger>
      <SheetContent className="w-96 overflow-auto">
        <SheetHeader className="mb-2">
          <SheetTitle>{book.title}</SheetTitle>
        </SheetHeader>
        <Outline book={book} onSelect={(chapter) => {
          const nodeEl = document.querySelector(`#chapter-${chapter.id}`)
          console.log(nodeEl);
          nodeEl?.scrollIntoView()
          setOpen(false)
        }} />
      </SheetContent>
    </Sheet>
  )
}


