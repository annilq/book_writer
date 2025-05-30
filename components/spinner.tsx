"use client";

import { cn } from "@/utils";

export const Spinner = ({ className }: { className?: string }) => {
  return (
    <div className={cn(className, " w-full h-full flex items-center justify-center absolute inset-0")}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={"animate-spin"}
      >
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
    </div>
  )
}