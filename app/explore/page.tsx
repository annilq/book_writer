"use client";

import { Grid, Search, Library } from "lucide-react"
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
              <h1 className="text-2xl font-semibold tracking-tight">Explore</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Discover books published by the community.
              </p>
            </div>
            {session.data?.user && (
              <Button variant="outline" size="sm" asChild>
                <Link href="/books"><Library className="mr-2 h-4 w-4" />My Bookshelf</Link>
              </Button>
            )}
          </div>

          <div className="flex items-center justify-between py-4">
            <div className="w-96 max-w-full">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="search" placeholder="Search books..." className="pl-9" />
              </div>
            </div>
            <div className="flex items-center">
              <Button variant="ghost" size="icon">
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
