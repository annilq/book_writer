"use client"

import * as React from "react"
import { Tree } from "@/components/tree";
import { Book, Chapter } from "@prisma/client";
import { arrayToTree, cn } from "@/utils";
import { Loader, Play, RefreshCw } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useTranslation } from "react-i18next";
import { CreateMessage, Message } from "ai";
import { Button } from "@/components/ui/button";
import { clearMessageOfChapter, getMessageOfChapter } from "@/app/api/chapter/actions";

export default function Outline({ book, isStreaming, handleSubmit, setMessages }: { book: Book & { chapters: Chapter[] }, isStreaming: boolean, setMessages: (message: Message[]) => void, handleSubmit: (chapterId: number, message: CreateMessage) => void }) {

  const treeData = React.useMemo(() => {
    return arrayToTree(book?.chapters)
  }, [book?.chapters])

  const { t } = useTranslation()

  return (
    !!treeData.length ? (
      <Tree
        selection={book.currentChapterId?.toString()}
        data={treeData}
        disableDrag
        disableMultiSelection
        idAccessor={(data) => {
          return data.id.toString()
        }}
        onSelect={async ([node]) => {
          if (node && (!node.children || node.children?.length === 0)) {
            const chapterId = Number(node.data.id)
            // only the current chapter and previous chapters have history messages
            const isCurrentChapter = chapterId === book.currentChapterId
            if (isCurrentChapter || chapterId < book.currentChapterId!) {
              const messages = await getMessageOfChapter(chapterId)
              setMessages(messages)
            } else {
              setMessages([])
            }
          }
        }}
        renderSuffix={(node) => {
          const chapterId = Number(node.data.id)
          const isCurrentChapter = chapterId === book.currentChapterId

          if (isStreaming && isCurrentChapter) {
            return <Loader className="animate-spin w-4 h-4" />
          }

          return !node.children?.length && (
            <>
              {isCurrentChapter || chapterId < book.currentChapterId! ? (
                isCurrentChapter && book.step !== "COMPLETE" ? (
                  <Button
                    onClick={async e => {
                      e.stopPropagation()
                      await clearMessageOfChapter(chapterId)
                      setMessages([])
                      handleSubmit(chapterId, { role: "user", content: node.data.title + node.data.content })
                    }}
                    className={cn("rounded-full h-6 w-6 p-0 hover:scale-105", node.isSelected && " bg-card text-card-foreground hover:bg-card hover:text-card-foreground")}
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                ) : <AlertDialog>
                  <AlertDialogTrigger asChild onClick={e => e.stopPropagation()}>
                    <Button className={cn("rounded-full h-6 w-6 p-0 hover:scale-105", node.isSelected && "bg-card text-card-foreground hover:bg-card hover:text-card-foreground")}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
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
                          handleSubmit(chapterId, { role: "user", content: node.data.title + node.data.content })
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
