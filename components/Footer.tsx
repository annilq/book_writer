import Link from "next/link"
import { GithubIcon } from "lucide-react"

export default function Footer() {
  return (
    <footer className="flex items-center justify-center gap-2 border-t bg-muted py-4 text-muted-foreground text-xs">
        <div>&copy; {new Date().getFullYear()} BookCraft. All rights reserved </div>
        <a
          href="https://github.com/annilq/book_writer"
          target="_blank"
        >
          <GithubIcon />
        </a>
    </footer>
  )
}

