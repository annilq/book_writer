"use client"

import { cn } from "@/utils/cn"
import { AlarmClockPlus, ArchiveIcon, BookAIcon, LayoutGrid, PanelLeft, Plus } from "lucide-react"
import Link from "next/link"
import type React from "react"
import Tags from "./Tags"
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { BookDialog } from "./BookDialog"
import { parseBookshelfStatus } from "@/utils/book-filters"

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
    >
      <Button variant={active ? "secondary" : "ghost"} className={cn("flex gap-2 items-center justify-start text-sm rounded p-2 w-full")}>
        {icon}
        <span>{children}</span>
      </Button>
    </Link>
  )
}

export default function SideBar() {
  const { t } = useTranslation()
  const [collapse, setCollapse] = useState(false)
  // The filter lives in the URL so these entries are real, shareable routes
  // rather than decoration.
  const status = parseBookshelfStatus(useSearchParams().get("status"))

  return (
    <div className={cn("flex flex-col gap-2 p-2 w-56 transition-all duration-100 bg-background border-r", collapse && "w-12 overflow-hidden")}>
      <BookDialog collapse={collapse} />
      <nav className="flex-1 flex flex-col gap-2">
        <NavItem href="/books" icon={<LayoutGrid className="h-4 w-4" />} active={status === "all"}>
          {!collapse && t("AllBooks")}
        </NavItem>
        <NavItem
          href="/books?status=draft"
          icon={<AlarmClockPlus className="h-4 w-4" />}
          active={status === "draft"}
        >
          {!collapse && t("DRAFT")}
        </NavItem>
        <NavItem
          href="/books?status=published"
          icon={<ArchiveIcon className="h-4 w-4" />}
          active={status === "published"}
        >
          {!collapse && t("PUBLISHED")}
        </NavItem>
        <NavItem
          href="/books?status=unpublished"
          icon={<BookAIcon className="h-4 w-4" />}
          active={status === "unpublished"}
        >
          {!collapse && t("UNPUBLISHED")}
        </NavItem>
        <Tags collapse={collapse} />
      </nav>
      <div className="p-2 flex justify-between items-center">
        <Button size={"icon"} variant={"ghost"} onClick={() => setCollapse(!collapse)} > <PanelLeft /> </Button>
      </div>
    </div>
  )
}