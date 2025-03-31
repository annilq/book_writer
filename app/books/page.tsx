"use client"

import { Bell, Grid, Plus, Search } from "lucide-react"
import Image from "next/image"
import type React from "react"
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import BookList from "./components/Books"
import SideBar from "./components/Sidebar"
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ThemeToggle from "@/components/ThemeToggle";

export default function BookManager() {
  const { t } = useTranslation()
  const session = useSession()

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <SideBar />

      {/* Main content */}
      <div className="flex-1">
        <header className="flex items-center justify-between border-b px-6 py-4">
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
            <Button variant="ghost" size="icon">
              <Bell className="h-4 w-4" />
            </Button>
            <Avatar className="h-9 w-9">
              <AvatarImage src={session.data?.user?.image!} alt={session.data?.user?.name!} />
              <AvatarFallback>{session.data?.user?.name}</AvatarFallback>
            </Avatar>
            <ThemeToggle />
          </div>
        </header>

        <div className="p-6">
          <div className="mb-6 flex items-center gap-4">
            <Button className="gap-2 rounded">
              <Plus className="h-4 w-4" />
              {t("create")}
            </Button>
          </div>
          <BookList />
        </div>
      </div>
    </div>
  )
}