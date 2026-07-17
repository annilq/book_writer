"use client";

import { produce } from "immer";
import { UIMessage, useChat } from "@ai-sdk/react";
import { useRouter } from "next/navigation";

import { removeChapterMessagesAfterMessageId, updateMessage } from "@/app/api/chat/actions";

import Header from "@/components/Header";
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
import { useTranslation } from "react-i18next"
import ChatLog from "@/components/Chat/chat-log";
import { useChaperStore } from "@/store/chapter";
import { toast } from "sonner";

export default function PageClient({ chat, messages: initialMessages }: { chat: Chat, messages: MessageWithParts[] }) {

  const router = useRouter();
  const { t } = useTranslation()
  const { message: activeMessage, setActiveMessage, setEditMessage } = useMessageStore()
  const { chapter } = useChaperStore()

  const { messages, status, sendMessage, regenerate, setMessages } = useChat({
    api: "/api/chapter",
    id: chat.id,
    messages: initialMessages.map(msg => ({
      id: msg.id,
      role: msg.role as "data" | "system" | "user" | "assistant",
      parts: [{ type: "text", text: msg.content }]
    })) as UIMessage[],
    async onFinish() {
      router.refresh();
    },
    onError: (e) => {
      console.log(e);
    }
  });

  const refresh = async (message: Pick<MessageClient, "id" | "content" | "model">, updateCurrentMessage: boolean = false) => {
    const currentMessageIndex = messages.findIndex(msg => msg.id === message.id)
    let updateMessages = messages.slice(0, currentMessageIndex + 1)
    if (updateCurrentMessage) {
      updateMessages = produce(updateMessages, draft => {
        draft[currentMessageIndex].parts = [{ type: "text", text: message.content }]
      })
    }

    setMessages(updateMessages)

    regenerate({
      body: {
        model: message.model,
        chatId: chat.id,
        book: chat,
        messages,
        messageId: message.id,
        chapterId: chapter?.id
      }
    })
    if (updateCurrentMessage) {
      updateMessage(message.id, message.content)
    }
    removeChapterMessagesAfterMessageId(chapter?.id!, message.id)
  };

  const onSave = async (message: MessageClient) => {
    const content = message.content;
    const book = await saveChapterContent(chapter?.id!, content)
    if (book?.step === "COMPLETE") {
      toast.success(t("congratulationsTitle"), {
        description: t("congratulationsDesc"),
        action: {
          label: "Okay!",
          onClick: () => router.replace(`/books/${chat.id}`),
        },
      })
    } else {
      setMessages([])
      router.refresh()
    }
  };

  const appendMessage = async (chapterId: number, message: UIMessage) => {
    const updateMessage = await createChapterMessage(chapterId, message) as MessageClient
    sendMessage(
      {
        id: updateMessage.id,
        role: updateMessage.role as "user" | "assistant" | "system",
        parts: [{ type: "text", text: updateMessage.content }]
      },
      { body: { model: chat.model, book: chat, chapterId: chapter?.id } }
    )
  };

  const { book, setActiveBook } = useBookStore()

  React.useEffect(() => {
    setActiveBook(chat)
  }, [chat, chat.id, setActiveBook])

  if (!book) {
    return
  }

  return (
    <div className="flex flex-col h-screen">
      <Header>
        <div className="flex flex-1 items-center justify-between gap-2 pl-2">
          <div className="flex min-w-0 items-center gap-2">
            <Button size="icon" variant="ghost" onClick={() => router.back()}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="truncate text-sm font-medium">{chat.title}</span>
          </div>
          <div className="flex items-center gap-1">
            <SettingsModal book={chat} />
            {!!activeMessage && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setActiveMessage(undefined)}>
                <ChevronsRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </Header>
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
                onInputMessage={(message: UIMessage | MessageClient) => {
                  if (message.id) {
                    refresh(message as MessageClient, true)
                  } else {
                    appendMessage(chapter?.id!, message as UIMessage)
                  }
                }}
                  isStreaming={status === "streaming"}
                />
              </div>
            </div>
            {!!activeMessage && (
              <ChapterContent
                chat={{ ...chat, messages:(messages as unknown as MessageClient[])  }}
                onMessageChange={setActiveMessage}
                isShowing={!!activeMessage}
                message={activeMessage as MessageClient}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}