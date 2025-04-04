"use client"

import { cn } from "@/utils/cn"
import { AlarmClockPlus, ArchiveIcon, BookAIcon, LayoutGrid, PanelLeft, Plus } from "lucide-react"
import Link from "next/link"
import type React from "react"
import Tags from "./Tags"
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { BookDialog } from "./BookDialog"

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

  return (
    <div className={cn("flex flex-col gap-2 p-2 w-56 transition-all duration-100 bg-background border-r", collapse && "w-12 overflow-hidden")}>
      <BookDialog collapse={collapse} />
      <nav className="flex-1 flex flex-col gap-2">
        <NavItem href="/books" icon={<LayoutGrid className="h-4 w-4" />} active>
          {!collapse && t("AllBooks")}
        </NavItem>
        <NavItem
          href="#"
          icon={<AlarmClockPlus className="h-4 w-4" />}
        >
          {!collapse && t("DRAFT")}
        </NavItem>
        <NavItem
          href="#"
          icon={<ArchiveIcon className="h-4 w-4" />}
        >
          {!collapse && t("PUBLISHED")}
        </NavItem>
        <NavItem
          href="#"
          icon={<BookAIcon className="h-4 w-4" />}
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