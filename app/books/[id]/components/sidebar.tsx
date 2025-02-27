"use client"

import * as React from "react"
import { Tree } from "./tree";
import { SettingsModal } from "./settingModal";
import useSWR from "swr";
import { Chapter } from "@prisma/client";

export default function Sidebar({ bookId }: { bookId: string }) {
  const { data: chapter = [] } = useSWR<Chapter[]>(`/api/book/chapter?bookId=${bookId}`)

  return (
    <div className="flex flex-col min-w-72 bg-background h-[calc(100vh-52px)] relative pb-8">
      <Tree
        data={chapter}
        className="overflow-auto h-[calc(100vh-36px)]"
        expandAll
        onSelectChange={(item) => { }}
      />
      <SettingsModal />
    </div>
  )
}
