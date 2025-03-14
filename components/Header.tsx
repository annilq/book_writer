"use client"

import { useState, useEffect } from "react"
import { ActiveLink } from "./Navbar"
import SignIn from "./SignIn"
import { cn } from "@/utils"

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
      className={cn("sticky w-full top-0 z-50 transition-all duration-300 bg-gradient-to-r from-purple-500 to-indigo-600", isScrolled && "shadow-md")}
    >
      <div className="container mx-auto flex justify-between gap-2 p-2">
        <div className="flex gap-4 flex-col md:flex-row md:items-center">
          <nav className="flex gap-1 flex-col md:flex-row">
            <ActiveLink href="/">Chat</ActiveLink>
          </nav>
        </div>
        <div className="flex justify-center">
          <SignIn />
        </div>
      </div>
    </header>
  )
}

