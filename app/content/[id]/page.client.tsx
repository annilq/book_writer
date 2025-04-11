"use client";

import { produce } from "immer";
import { CreateMessage, Message, useChat } from "@ai-sdk/react";
import { useRouter } from "next/navigation";

import { removeChapterMessagesAfterMessageId, updateMessage } from "@/app/api/chat/actions";

import BookHeader from "@/app/chats/[id]/components/chat-header";
import Outline from "./components/outline";
import { SettingsModal } from "@/app/chats/[id]/components/setting-modal";
import ChatBox from "@/components/Chat/chat-box";
import type { Chat } from "./page";
import { cn } from "@/utils";

import { Message as MessageClient } from '@prisma/client'
import { useMessageStore } from "@/store/message";
import { Button } from "@/components/ui/button";
import { Check, ChevronLeft, ChevronsRight, Loader } from "lucide-react";
import ChapterContent from "./components/chapter-content";
import { createChapterMessage, MessageWithParts, saveChapterContent } from "@/app/api/chapter/actions";
import { useBookStore } from "@/store/book";
import React, { startTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@radix-ui/react-toast";
import { useTranslation } from "react-i18next"
import ChatLog from "@/components/Chat/chat-log";
import { useChaperStore } from "@/store/chapter";

export default function PageClient({ chat, messages: initialMessages }: { chat: Chat, messages: MessageWithParts[] }) {

  const { toast } = useToast()
  const router = useRouter();
  const { t } = useTranslation()
  const { message: activeMessage, setActiveMessage, setEditMessage } = useMessageStore()
  const { chapter } = useChaperStore()

  const { messages, status, append, reload, setMessages } = useChat({
    api: "/api/chapter",
    id: chat.id,
    initialMessages,
    async onFinish(message, options) {
      router.refresh();
    },
    onError: (e) => {
      console.log(e);
    }
  });

  const refresh = async (message: Pick<MessageClient, "id" | "content" | "model" | "chapterId">, updateCurrentMessage: boolean = false) => {
    const currentMessageIndex = messages.findIndex(msg => msg.id === message.id)
    let updateMessages = messages.slice(0, currentMessageIndex + 1)
    if (updateCurrentMessage) {
      updateMessages = produce(updateMessages, draft => {
        draft[currentMessageIndex].content = message.content
      })
    }

    setMessages(updateMessages)

    reload({
      body: {
        model: message.model,
        chatId: chat.id,
        book: chat,
        messages,
        messageId: message.id,
        chapterId: message.chapterId
      }
    })
    if (updateCurrentMessage) {
      updateMessage(message.id, message.content)
    }
    removeChapterMessagesAfterMessageId(chapter?.id!, message.id)
  };

  const onSave = async (message: Message) => {

    const book = await saveChapterContent(chapter?.id!, message.content)
    if (book?.step === "COMPLETE") {
      toast({
        title: t("congratulationsTitle"),
        description: t("congratulationsDesc"),
        action: (
          <ToastAction altText="Goto read book">Okay!</ToastAction>
        ),
      })
    } else {
      setMessages([])
      router.refresh()
    }
  };

  const appendMessage = async (chapterId: number, message: CreateMessage) => {
    const updateMessage = await createChapterMessage(chapterId, message) as Message
    append(updateMessage, { body: { model: chat.model, book: chat, chapterId: chapter?.id } })
  };

  const { book, setActiveBook } = useBookStore()

  React.useEffect(() => {
    setActiveBook(chat)
  }, [chat.id, setActiveBook])

  if (!book) {
    return
  }

  return (
    <div className="flex flex-col h-screen">
      <BookHeader className="px-4">
        <div className="flex items-center flex-1 gap-2">
          <Button size="icon" variant="ghost" onClick={() => router.back()}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {chat.title}
        </div>
        <div className="flex items-center">
          <SettingsModal book={chat} />
          {!!activeMessage && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setActiveMessage(undefined)}>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </BookHeader>
      <div className="flex flex-1 bg-background text-foreground overflow-hidden">
        <Outline book={chat} handleSubmit={appendMessage} setMessages={setMessages} isStreaming={status === "streaming"} />
        <main className="flex flex-1 flex-col">
          <div className="flex flex-1 overflow-auto">
            <div className="flex flex-col flex-1  w-full shrink-0 overflow-hidden lg:w-2/5">
              <div className={cn("flex flex-col flex-1 overflow-auto w-full", !activeMessage && "max-w-4xl mx-auto")}>
                <ChatLog
                  messages={messages}
                  toolConfig={{
                    onRefresh: (message) => {
                      refresh(message)
                    },
                    onEdit(message) {
                      if (message.role === "user") {
                        setEditMessage(message)
                        // } else {
                        //   if (activeMessage?.id !== message.id) {
                        //     setActiveMessage(message)
                        //   } else {
                        //     setActiveMessage()
                        //   }
                        //   console.log(message);
                        // 
                      }
                    },
                    // onFix: (newMessageText) => {
                    //   startTransition(async () => {
                    //     appendMessage(chapter?.id!, { content: newMessageText, role: 'user' });
                    //   });
                    // },
                    markdownEditable: true,
                    action: (message => {
                      if (message.role === "user") {
                        return false
                      }
                      return (
                        <div className="flex flex-1 justify-end">
                          {status === "streaming" ? <Loader className="animate-spin w-4 h-4" /> : (
                            <Button variant="ghost" size="icon" onClick={() => onSave(message)}>
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      )
                    })
                  }}

                />
                <ChatBox
                  onInputMessage={(message: CreateMessage | MessageClient) => {
                    if (message.id) {
                      refresh(message as MessageClient, true)
                    } else {
                      appendMessage(chapter?.id!, message as CreateMessage)
                    }
                  }}
                  isStreaming={status === "streaming"}
                />
              </div>
            </div>
            {!!activeMessage && (
              <ChapterContent
                chat={{ ...chat, messages }}
                onMessageChange={setActiveMessage}
                isShowing={!!activeMessage}
                message={activeMessage as Message}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}