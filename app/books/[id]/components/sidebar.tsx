"use client"

import * as React from "react"
import { Tree } from "./tree";
import { SettingsModal } from "./settingModal";
import useSWR from "swr";
import { Chapter } from "@prisma/client";

const data = [
  { id: "1", name: "Unread" },
  { id: "2", name: "Threads" },
  {
    id: "3",
    name: "Chat Rooms",
    children: [
      { id: "c1", name: "General" },
      { id: "c2", name: "Random" },
      { id: "c3", name: "Open Source Projects Projects Projects" },
    ],
  },
  {
    id: "4",
    name: "Direct Messages",
    children: [
      {
        id: "d1",
        name: "Alice",
        children: [
          { id: "d11", name: "Alice2" },
          { id: "d12", name: "Bob2" },
          { id: "d13", name: "Charlie2" },
        ],
      },
      { id: "d2", name: "Bob" },
      { id: "d3", name: "Charlie" },
    ],
  },
  {
    id: "5",
    name: "Direct Messages",
    children: [
      {
        id: "e1",
        name: "Alice",
        children: [
          { id: "e11", name: "Alice2" },
          { id: "e12", name: "Bob2" },
          { id: "e13", name: "Charlie2" },
        ],
      },
      { id: "e2", name: "Bob" },
      { id: "e3", name: "Charlie" },
    ],
  },
  {
    id: "6",
    name: "Direct Messages",
    children: [
      {
        id: "f1",
        name: "Alice",
        children: [
          { id: "f11", name: "Alice2" },
          { id: "f12", name: "Bob2" },
          { id: "f13", name: "Charlie2" },
        ],
      },
      { id: "f2", name: "Bob" },
      { id: "f3", name: "Charlie" },
    ],
  },
];


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
