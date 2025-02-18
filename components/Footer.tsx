import Link from "next/link"
import { GithubIcon } from "lucide-react"

export default function Footer() {
  return (
    <footer className="flex items-center justify-center gap-2 bg-gray-800 py-4 text-gray-400">
        <div>&copy; {new Date().getFullYear()} BookCraft. All rights reserved </div>
        <a
          href="https://github.com/annilq/book_writer"
          target="_blank"
        >
          <GithubIcon className="size-3" />
        </a>
    </footer>
  )
}

