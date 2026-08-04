import { Tag } from "@prisma/client";
import { TagsIcon } from "lucide-react";
import Link from "next/link"
import type React from "react"
import { useTranslation } from "react-i18next";
import useSWR from "swr";

function TagItem({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md">
      <TagsIcon className="w-4 h-4 text-muted-foreground" />
      <span>{children}</span>
    </Link>
  )
}

export default function Tags({ collapse }: { collapse: boolean }) {
  const { t } = useTranslation()
  const { data: tags } = useSWR<Tag[]>('/api/tag')

  return (
    <div className="py-3">
      <div className="px-2 text-xs font-medium uppercase text-muted-foreground flex justify-between items-center">
        {!collapse ? t("Tags") : ""}
      </div>
      <div className="mt-2">
        {tags?.map(tag => <TagItem key={tag.id} href={tag.id.toString()}>{tag.name}</TagItem>)}
      </div>
    </div>
  )
}