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
      className={cn(
        "sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300",
        isScrolled && "shadow-sm",
        className
      )}
    >
      <div className="flex items-center justify-between gap-4 px-4 py-2">
        <nav className="flex items-center gap-1 overflow-x-auto">
          <ActiveLink href="/">{t("home")}</ActiveLink>
          {session.data?.user && (
            <ActiveLink href="/books">{t("bookshelf")}</ActiveLink>
          )}
          <ActiveLink href="/explore">{t("explore")}</ActiveLink>
          {session.data?.user && (
            <ActiveLink href="/user/subscription">{t("subscription")}</ActiveLink>
          )}
        </nav>
        {children}
        <div className="flex shrink-0 items-center justify-center gap-2">
          <SignIn />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}

