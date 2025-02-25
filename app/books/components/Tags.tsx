import { Button } from "@/components/ui/button";
import { Tag } from "@prisma/client";
import { Plus, TagsIcon } from "lucide-react";
import Link from "next/link"
import type React from "react"
import { useTranslation } from "react-i18next";
import useSWR from "swr";

function TagItem({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
      <TagsIcon className="w-4 h-4 text-gray-400" />
      <span>{children}</span>
    </Link>
  )
}

export default function Tags() {
  const { t } = useTranslation()
  const { data: tags } = useSWR<Tag[]>('/api/tag')

  return (
    <div className="py-3">
      <div className="px-3 text-xs font-medium uppercase text-gray-500 flex justify-between items-center">
        {t("Tags")}
        <Button size="icon" variant={"link"}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="mt-2">
        {tags?.map(tag => <TagItem key={tag.id} href={tag.id.toString()}>{tag.name}</TagItem>)}
      </div>
    </div>
  )
}