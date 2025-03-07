"use client"

import { useState, useEffect } from "react"
import { cn } from "@/utils"

export default function BookHeader({ children }: { children: React.ReactNode }) {
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
    <div
      className={cn("flex justify-between sticky w-full top-0 z-50 transition-all duration-300 bg-background border-b px-4 h-12 text-sm", isScrolled && "border-b")}
    >
      {children}
    </div>
  )
}

