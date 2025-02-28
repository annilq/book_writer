"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/utils/cn"
import { AlarmClockPlus, ArchiveIcon, Bell, BookAIcon, Grid, LayoutGrid, Plus, Search, Upload } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import type React from "react"
import BookList from "./components/Books"
import Tags from "./components/Tags"
import { useTranslation } from "react-i18next";

interface NavItemProps {
  href: string
  icon: React.ReactNode
  children: React.ReactNode
  active?: boolean
}

function NavItem({ href, icon, children, active }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn("flex items-center gap-2 px-3 py-2 text-sm text-gray-700 rounded-lg", active && "bg-gray-100")}
    >
      {icon}
      <span>{children}</span>
    </Link>
  )
}

export default function BookManager() {
  const { t } = useTranslation()

  return (
    <div className="flex-1 flex">
      {/* Sidebar */}
      <div className="w-64 border-r bg-background">
        <div className="p-4">
          <h1 className="text-xl font-bold text-foreground">Bookshelf</h1>
        </div>
        <nav className="space-y-1 px-2">
          <NavItem href="/books" icon={<LayoutGrid className="h-4 w-4" />} active>
            {t("AllBooks")}
          </NavItem>
          <NavItem
            href="#"
            icon={<AlarmClockPlus className="h-4 w-4" />}
          >
            {t("DRAFT")}
          </NavItem>
          <NavItem
            href="#"
            icon={<ArchiveIcon className="h-4 w-4" />}
          >
            {t("PUBLISHED")}
          </NavItem>
          <NavItem
            href="#"
            icon={<BookAIcon className="h-4 w-4" />}
          >
            {t("UNPUBLISHED")}
          </NavItem>
          <Tags />
        </nav>
      </div>

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
            <div className="h-8 w-8 overflow-hidden rounded-full">
              <Image
                src="/placeholder.svg"
                alt="Avatar"
                width={32}
                height={32}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </header>

        <div className="p-6">
          <div className="mb-6 flex items-center gap-4">
            <Button className="gap-2">
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