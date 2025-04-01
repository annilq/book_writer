"use client"

import { useState, useEffect } from "react"
import SignIn from "./SignIn"
import { cn } from "@/utils"
import ThemeToggle from "./ThemeToggle"

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false)

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
      className={cn("sticky w-full top-0 z-50 transition-all duration-300 bg-linear-to-r from-purple-500 to-indigo-600", isScrolled && "shadow-md")}
    >
      <div className="container mx-auto flex justify-end gap-2 p-2">
        <div className="flex justify-center gap-2">
          <SignIn />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}

