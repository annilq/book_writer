"use client"

import { Grid, List, Search, Plus } from "lucide-react"
import type React from "react"
import { useTranslation } from "react-i18next";

import SideBar from "../books/components/Sidebar";
import Books from "../books/components/Books";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { cn } from "@/utils";
import Link from "next/link";
import { Compass } from "lucide-react";
import { useState } from "react";

type Filter = "ALL" | "OUTLINE" | "CHAPTER" | "COMPLETE";

const FILTERS: { key: Filter; label: string; dot: string }[] = [
  { key: "ALL", label: "All", dot: "bg-foreground/40" },
  { key: "OUTLINE", label: "Draft", dot: "bg-slate-500" },
  { key: "CHAPTER", label: "Writing", dot: "bg-amber-500" },
  { key: "COMPLETE", label: "Published", dot: "bg-success" },
];

export default function BookManager() {
  const { t } = useTranslation()
  const session = useSession()
  const [filter, setFilter] = useState<Filter>("ALL")

  if (!session.data?.user) {
    redirect("/")
  }

  const step = filter === "ALL" ? undefined : filter;

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header className="bg-background border-b h-14" />
      <div className="flex flex-1 overflow-hidden">
        <SideBar />
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar + heading */}
          <div className="border-b bg-background/50 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">My Bookshelf</h1>
                <p className="text-sm text-muted-foreground mt-1">Your AI-generated book projects and their status.</p>
              </div>
              <Button size="sm" className="h-9 shadow-sm" asChild>
                <Link href="/"><Plus className="mr-2 h-4 w-4" />New Book</Link>
              </Button>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1 rounded-lg bg-muted/50 p-1">
                {FILTERS.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                      filter === f.key
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span className={cn("h-1.5 w-1.5 rounded-full", f.dot)} />
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search books..."
                    className="h-9 w-56 border-border bg-background pl-9 focus-visible:border-brand/50 focus-visible:ring-brand/20"
                  />
                </div>
                <div className="hidden items-center rounded-md border bg-muted/40 p-0.5 sm:flex">
                  <Button variant="ghost" size="sm" className="h-7 w-7 rounded-sm bg-background p-0 shadow-sm">
                    <Grid className="h-4 w-4 text-foreground" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 rounded-sm p-0 text-muted-foreground hover:text-foreground">
                    <List className="h-4 w-4" />
                  </Button>
                </div>
                <Button variant="outline" size="sm" className="border-brand/30 text-brand hover:bg-brand/5 hover:text-brand" asChild>
                  <Link href="/explore"><Compass className="mr-2 h-4 w-4" />Explore</Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="mx-auto">
              <Books step={step} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
