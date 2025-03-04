"use client"

import * as React from "react"
import { Tree } from "./tree";
import { SettingsModal } from "./setting-modal";
import useSWR from "swr";
import { Book, Chapter } from "@prisma/client";
import { arrayToTree } from "@/utils";

export default function Sidebar({ book }: { book: Book }) {
  const { data: chapter = [] } = useSWR<Chapter[]>(`/api/book/chapter?bookId=${book.id}`)

  const treeData = React.useMemo(() => {
    return arrayToTree(chapter)
  }, [chapter])

  return (
    <div className="flex flex-col min-w-72 relative overflow-y-auto bg-muted">
      <div className="p-2 space-y-2 flex-1">
        <div>{book.title}</div>
        <Tree
          data={treeData}
          expandAll
          onSelectChange={(item) => { }}
        />
      </div>
      <div className="absolute bottom-0 left-0">
        <SettingsModal book={book} />
      </div>
    </div>
  )
}
