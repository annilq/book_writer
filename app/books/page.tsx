"use client"

import { Grid, List, Search, Plus } from "lucide-react"
import type React from "react"
import { Suspense, useState } from "react";
import { useTranslation } from "react-i18next";

import SideBar from "../books/components/Sidebar";
import Books, { type BookshelfView } from "../books/components/Books";
import { BookDialog } from "../books/components/BookDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/utils/cn";

export default function BookManager() {
  const { t } = useTranslation()
  const session = useSession()
  const [query, setQuery] = useState("")
  const [view, setView] = useState<BookshelfView>("grid")

  if (!session.data?.user) {
    redirect("/")
  }
  return (
    <div className="flex flex-col h-screen bg-background">
      <Header className="bg-background border-b h-14" />
      <div className="flex flex-1 overflow-hidden">
        {/* Both the sidebar and the list read the status filter from the URL. */}
        <Suspense fallback={<div className="w-56 border-r bg-background" />}>
          <SideBar />
        </Suspense>
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between border-b px-6 py-3 bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex items-center gap-4 w-full max-w-lg">
                    <div className="relative w-full">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={t("search")}
                            aria-label={t("search")}
                            className="pl-9 bg-muted/40 border-muted-foreground/20 focus-visible:bg-background h-9 transition-colors"
                        />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                     <div className="flex items-center border rounded-md p-0.5 bg-muted/40">
                        <Button
                            variant="ghost"
                            size="sm"
                            aria-label={t("gridView")}
                            aria-pressed={view === "grid"}
                            onClick={() => setView("grid")}
                            className={cn(
                              "h-7 w-7 p-0 rounded-sm",
                              view === "grid"
                                ? "bg-background shadow-sm hover:bg-background text-foreground"
                                : "text-muted-foreground hover:text-foreground",
                            )}
                        >
                            <Grid className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            aria-label={t("listView")}
                            aria-pressed={view === "list"}
                            onClick={() => setView("list")}
                            className={cn(
                              "h-7 w-7 p-0 rounded-sm",
                              view === "list"
                                ? "bg-background shadow-sm hover:bg-background text-foreground"
                                : "text-muted-foreground hover:text-foreground",
                            )}
                        >
                            <List className="h-4 w-4" />
                        </Button>
                    </div>
                    <Separator orientation="vertical" className="h-6 mx-2" />
                    <BookDialog
                        trigger={
                          <Button size="sm" className="h-9">
                              <Plus className="mr-2 h-4 w-4" />
                              {t("newBook")}
                          </Button>
                        }
                    />
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                <div className="mx-auto space-y-6">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">{t("bookshelfOverview")}</h1>
                        <p className="text-sm text-muted-foreground mt-1">{t("bookshelfOverviewDesc")}</p>
                    </div>
                    <Suspense fallback={null}>
                      <Books query={query} view={view} />
                    </Suspense>
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}
