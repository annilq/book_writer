import Link from "next/link"
import type React from "react" // Import React

function TagItem({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
        />
      </svg>
      <span>{children}</span>
    </Link>
  )
}

export default function Tags() {
  return (
    <div className="py-3">
      <div className="px-3 text-xs font-medium uppercase text-gray-500">Collections</div>
      <div className="mt-2">
        <TagItem href="#">Product Demos</TagItem>
        <TagItem href="#">Case Studies</TagItem>
        <TagItem href="#">Sales Collateral</TagItem>
        <TagItem href="#">Training Materials</TagItem>
      </div>
    </div>
  )
}