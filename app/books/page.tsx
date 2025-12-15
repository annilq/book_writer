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
import { Separator } from "@/components/ui/separator";

export default function BookManager() {
  const { t } = useTranslation()
  const session = useSession()
  if (!session.data?.user) {
    redirect("/")
  }
  return (
    <div className="flex flex-col h-screen bg-background">
      <Header className="bg-background border-b h-14" />
      <div className="flex flex-1 overflow-hidden">
        <SideBar />
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between border-b px-6 py-3 bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex items-center gap-4 w-full max-w-lg">
                    <div className="relative w-full">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            type="search" 
                            placeholder="Search books..." 
                            className="pl-9 bg-muted/40 border-muted-foreground/20 focus-visible:bg-background h-9 transition-colors" 
                        />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                     <div className="flex items-center border rounded-md p-0.5 bg-muted/40">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-sm bg-background shadow-sm hover:bg-background">
                            <Grid className="h-4 w-4 text-foreground" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-sm text-muted-foreground hover:text-foreground">
                            <List className="h-4 w-4" />
                        </Button>
                    </div>
                    <Separator orientation="vertical" className="h-6 mx-2" />
                    <Button size="sm" className="h-9">
                        <Plus className="mr-2 h-4 w-4" />
                        New Book
                    </Button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                <div className="mx-auto space-y-6">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
                        <p className="text-sm text-muted-foreground mt-1">Manage your book projects and view their status.</p>
                    </div>
                    <Books />
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}
