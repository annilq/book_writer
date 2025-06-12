"use client"

import * as React from "react"
import { Tree } from "@/components/tree";
import { arrayToTree } from "@/utils";
import { BookWithChapters } from "../page.client";
import { Chapter } from "@prisma/client";

export default function Outline({ book,onSelect }: { book: BookWithChapters,onSelect: (node: Chapter) => void  }) {

  const treeData = React.useMemo(() => {
    return arrayToTree(book?.chapters).map(chapter => ({
      ...chapter,
      id: chapter.id.toString(),
      content: chapter.content || ""
    }))
  }, [book?.chapters])

  return (
    !!treeData.length ? (
      <Tree
        data={treeData}
        disableDrag
        idAccessor={(data) => {
          return data.id.toString()
        }}
        onSelect={([node]) => {
          if (node) {
            onSelect(node.data as unknown as Chapter)
          }
        }}
        renderSuffix={() => null}
      />
    ) : false
  )
}
