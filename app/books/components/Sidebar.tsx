"use client"

import { cn } from "@/utils/cn"
import { AlarmClockPlus, ArchiveIcon, Bell, BookAIcon, Grid, LayoutGrid, PanelLeft, PanelRight, Plus, Search, Upload } from "lucide-react"
import Link from "next/link"
import type React from "react"
import Tags from "./Tags"
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button"
import { useState } from "react"

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
      <Button variant={active ? "default" : "ghost"} className={cn("flex gap-2 items-center justify-start text-sm rounded p-2 w-full")}>
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
    <div className={cn("w-56 transition-all duration-100 bg-muted", collapse && "w-12 overflow-hidden")}>
      <div className="p-2 flex justify-between items-center">
        {!collapse && <Link href={"/"}><h1 className="text-xl font-bold text-foreground">BookCraft</h1></Link>}
        <Button size={"icon"} variant={"ghost"} onClick={() => setCollapse(!collapse)} > <PanelLeft /> </Button>
      </div>
      <nav className="space-y-1 px-2">
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
    </div>
  )
}