"use client";

import { Grid, Search, Library, Compass } from "lucide-react"
import type React from "react"
import { useTranslation } from "react-i18next";

import Books from "../books/components/Books";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function BookManager() {
  const { t } = useTranslation()
  const session = useSession()

  return (
    <div className="flex flex-col gap-4 h-screen bg-background">
      <Header className="border-b" />
      <div className="flex flex-1 flex-col gap-4 px-4 overflow-y-auto">
        <div className="mx-auto w-full max-w-6xl">
          <div className="flex flex-wrap items-end justify-between gap-4 pt-6">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
                <Compass className="h-3.5 w-3.5" />
                Community Library
              </div>
              <h1 className="text-2xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Explore
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Discover books published by the community.
              </p>
            </div>
            {session.data?.user && (
              <Button variant="outline" size="sm" className="border-brand/30 text-brand hover:bg-brand/5 hover:text-brand" asChild>
                <Link href="/books"><Library className="mr-2 h-4 w-4" />My Bookshelf</Link>
              </Button>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl border bg-card/50 px-3 py-2.5">
            <div className="w-96 max-w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search books..."
                  className="border-transparent bg-transparent pl-9 shadow-none focus-visible:border-brand/50 focus-visible:ring-brand/20"
                />
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="text-brand hover:bg-brand/10" aria-label="Grid view">
                <Grid className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Books publicOnly />
        </div>
      </div>
    </div>
  )
}
