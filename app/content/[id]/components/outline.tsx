"use client"

import * as React from "react"
import { Tree } from "@/components/tree";
import { Book, Chapter } from "@prisma/client";
import { arrayToTree } from "@/utils";
import { Play, RefreshCw } from "lucide-react";
import { useChapterStore } from "@/store/chapter";
import { getChapterById } from "@/app/api/book/actions";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useTranslation } from "react-i18next";
import { CreateMessage, Message } from "ai";

export default function Outline({ book, handleSubmit, setMessages }: { book: Book & { chapters: Chapter[] }, setMessages: (message: Message[]) => void, handleSubmit: (chapterId: number, message: CreateMessage) => void }) {

  const treeData = React.useMemo(() => {
    return arrayToTree(book?.chapters)
  }, [book?.chapters])

  const { setActiveChapter } = useChapterStore()
  const { t } = useTranslation()

  return (
    !!treeData.length ? (
      <Tree
        data={treeData}
        disableDrag
        disableMultiSelection
        idAccessor={(data) => {
          return data.id.toString()
        }}
        onSelect={async ([node]) => {
          if (node) {
            const data = await getChapterById(Number(node.data.id))
            setActiveChapter(data)
            setMessages(data?.messages)
          }
        }}
        renderSuffix={(node) => {          
          return !node.children?.length && (
            <>
              {Number(node.data.id) === book.currentChapterId || Number(node.data.id) < book.currentChapterId! ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild onClick={e => e.stopPropagation()}>
                    {Number(node.data.id) === book.currentChapterId ? (
                      <Play className="h-4 w-4 cursor-pointer" />
                    ) : <RefreshCw className="h-4 w-4 cursor-pointer" />}
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t("booklineConfirmTip")}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t("booklineConfirmContent")}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={e => e.stopPropagation()}>{t("cancel")}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={async (e) => {
                          e.stopPropagation()
                          setMessages([])
                          setActiveChapter(node.data)
                          handleSubmit(Number(node.data.id), { role: "user", content: node.data.title + node.data.content })
                        }}>
                        {t("save")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>) : false}
            </>

          )
        }}
        className="w-1/5 bg-muted overflow-y-auto text-sm px-2"
      />
    ) : false
  )
}
