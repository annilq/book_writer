"use client"

import * as React from "react"
import { Tree } from "@/components/tree";
import { Book, Chapter } from "@prisma/client";
import { arrayToTree } from "@/utils";
import { RefreshCw } from "lucide-react";
import { useChapterStore } from "@/store/chapter";
import { getChapterById } from "@/app/api/book/actions";

export default function Outline({ book }: { book: Book & { chapters: Chapter[] } }) {

  const treeData = React.useMemo(() => {
    return arrayToTree(book?.chapters)
  }, [book?.chapters])

  const { setActiveChapter } = useChapterStore()

  return (
    !!treeData.length ? (
      <Tree
        data={treeData}
        disableDrag
        idAccessor={(data) => {
          return data.id.toString()
        }}
        renderSuffix={(node) => {
          return !node.children?.length && (
            <div className="flex gap-2">
              <RefreshCw className="h-4 w-4 cursor-pointer" onClick={async () => {
                console.log(node);
                
                const data = await getChapterById(Number(node.data.id))
                console.log(data);
                
                setActiveChapter(data)
              }} />
            </div>
          )
        }}
        className="w-1/5 bg-muted overflow-y-auto text-sm px-2"
      />
    ) : false
  )
}
