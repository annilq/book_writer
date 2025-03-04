"use client"

import { cn } from "@/utils/cn"
import { AlarmClockPlus, ArchiveIcon, Bell, BookAIcon, Grid, LayoutGrid, Plus, Search, Upload } from "lucide-react"
import Link from "next/link"
import type React from "react"
import Tags from "./Tags"
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

export default function SideBar() {
  const { t } = useTranslation()

  return (
    <div className="w-64 border-r bg-muted">
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
  )
}