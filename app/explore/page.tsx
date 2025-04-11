"use client"

import { Grid, Search } from "lucide-react"
import type React from "react"
import { useTranslation } from "react-i18next";

import Books from "../books/components/Books";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";

export default function BookManager() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-4 h-screen bg-background">
      <Header className="border-b" />
      <div className="flex flex-1 flex-col gap-4 w-[1000px] mx-auto">
        <div className="flex items-center justify-between">
          <div className="w-96">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input type="search" placeholder="Search books..." className="pl-9" />
            </div>
          </div>
          <div className="flex items-center">
            <Button variant="ghost" size="icon">
              <Grid className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Books />
      </div>
    </div>
  )
}