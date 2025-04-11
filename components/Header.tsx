"use client"

import React, { useState, useEffect } from "react"
import SignIn from "./SignIn"
import { cn } from "@/utils"
import ThemeToggle from "./ThemeToggle"
import { ActiveLink } from "./Navbar"
import { useTranslation } from "react-i18next"
import { useSession } from "next-auth/react"

export default function Header({ className, children = false }: { className?: string, children?: React.ReactNode }) {
  const [isScrolled, setIsScrolled] = useState(false)
  const { t } = useTranslation()
  const session = useSession()

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }

    window.addEventListener("scroll", handleScroll)

    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  return (
    <header
      className={cn("sticky w-full top-0 z-50 transition-all duration-300 bg-linear-to-r", isScrolled && "shadow-md", className)}
    >
      <div className="flex justify-between gap-4 px-4 py-2">
        <nav className="flex gap-1 flex-col md:flex-row">
          <ActiveLink href="/">{t("home")}</ActiveLink>
          {session.data?.user ? <ActiveLink href="/books">{t("bookshelf")}</ActiveLink> : false}
          <ActiveLink href="/explore">{t("explore")}</ActiveLink>
        </nav>
        {children}
        <div className="flex justify-center gap-4">
          <SignIn />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}

