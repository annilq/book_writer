"use client"

import * as React from "react"
import { Tree } from "@/components/tree";
import { Book, Chapter } from "@prisma/client";
import { arrayToTree } from "@/utils";
import { Play, RefreshCw } from "lucide-react";

export default function Outline({ book }: { book: Book & { chapters: Chapter[] } }) {

  const treeData = React.useMemo(() => {
    return arrayToTree(book?.chapters)
  }, [book?.chapters])

  return (
    !!treeData.length ? (
      <Tree
        data={treeData}
        disableDrag
        idAccessor={(data) => {
          return data.id.toString()
        }}
        className="w-1/5 bg-muted overflow-y-auto text-sm px-2"
      />
    ) : false
  )
}
