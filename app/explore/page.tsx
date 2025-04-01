"use client"

import { Grid, Plus, Search } from "lucide-react"
import type React from "react"
import { useTranslation } from "react-i18next";

import SideBar from "../books/components/Sidebar";
import Books from "../books/components/Books";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";

export default function BookManager() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col h-screen">
      <Header className="bg-secondary border-b" />
      <div className="flex flex-1">
        <SideBar />
        <div className="flex-1">
          <div className="flex items-center justify-between border-b px-6 py-4">
            <div className="w-96">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input type="search" placeholder="Search books..." className="pl-9" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon">
                <Grid className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="p-6">
            <div className="mb-6 flex items-center gap-4">
              <Button className="gap-2 rounded">
                <Plus className="h-4 w-4" />
                {t("create")}
              </Button>
            </div>
            <Books />
          </div>
        </div>
      </div>
    </div>
  )
}