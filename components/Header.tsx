"use client"

import { useState, useEffect } from "react"
import { ActiveLink } from "./Navbar"
import SignIn from "./SignIn"


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
      className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled ? " bg-foreground shadow-md" : "bg-transparent"
        }`}
    >
      <div className="container mx-auto flex justify-between gap-2 p-2 sticky top-0 z-10">
        <div className="flex gap-4 flex-col md:flex-row md:items-center">
          <nav className="flex gap-1 flex-col md:flex-row">
            <ActiveLink href="/">🏴‍☠️ Chat</ActiveLink>
            <ActiveLink href="/structured_output">
              🧱 Structured Output
            </ActiveLink>
            <ActiveLink href="/agents">🦜 Agents</ActiveLink>
            <ActiveLink href="/retrieval">🐶 Retrieval</ActiveLink>
            <ActiveLink href="/retrieval_agents">
              🤖 Retrieval Agents
            </ActiveLink>
            <ActiveLink href="/ai_sdk">
              🌊 LangChain x AI SDK RSC
            </ActiveLink>
          </nav>
        </div>
        <div className="flex justify-center">
          <SignIn />

        </div>
      </div>
    </header>
  )
}

