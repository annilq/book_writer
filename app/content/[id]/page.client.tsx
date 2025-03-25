"use client";

import { produce } from "immer";
import { CreateMessage, Message, useChat } from "@ai-sdk/react";
import { useRouter } from "next/navigation";

import { createChapterMessage, removeChapterMessagesAfterMessageId, updateMessage } from "@/app/api/chat/actions";

import BookHeader from "@/app/chats/[id]/components/chat-header";
import Outline from "./components/outline";
import { SettingsModal } from "@/app/chats/[id]/components/setting-modal";
import ChatBox from "@/app/chats/[id]/components/chat-box";
import ChatLog from "@/app/chats/[id]/components/chat-log";
import type { Chat } from "./page";
import { cn } from "@/utils";

import { Message as MessageClient } from '@prisma/client'
import { useMessageStore } from "@/store/message";
import { Button } from "@/components/ui/button";
import { ChevronsRight } from "lucide-react";
import { useChapterStore } from "@/store/chapter";
import ChapterContent from "./components/chapter-content";

export default function PageClient({ chat }: { chat: Chat }) {
  const router = useRouter();
  const { chapter } = useChapterStore()

  const { message: activeMessage, setActiveMessage } = useMessageStore()

  const { messages, status, append, reload, setMessages } = useChat({
    api: "/api/chapter",
    id: chat.id,
    async onFinish(message, options) {
      console.log(message);
      await createChapterMessage(chapter!.id, message) as Message
      router.refresh();
    },
    onError: (e) => {
      console.log(e);
    }
  });

  const refreshAssitant = async (message: MessageClient, updateCurrentMessage: boolean = false) => {
    // fliter message  and reload
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
        messageId: message.id
      }
    })
    if (updateCurrentMessage) {
      updateMessage(message.id, message.content)
    }
    removeChapterMessagesAfterMessageId(chapter!.id, message.id)
  };

  const appendMessage = async (chapterId: number, message: CreateMessage) => {
    const updateMessage = await createChapterMessage(chapterId, message) as Message
    append(updateMessage, { body: { model: chat.model, book: chat } })
  };

  return (
    <div className="flex bg-background text-foreground h-screen overflow-hidden">
      <Outline book={chat} handleSubmit={appendMessage} setMessages={setMessages} />
      <main className="flex flex-1 flex-col">
        <BookHeader>
          <div className="flex items-center flex-1">
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
        <div className="flex flex-1 overflow-auto">
          <div className="flex flex-col flex-1  w-full shrink-0 overflow-hidden lg:w-2/5">
            <div className={cn("flex flex-col flex-1 overflow-auto w-full", !activeMessage && "max-w-3xl mx-auto")}>
              <ChatLog
                chat={{ ...chat, messages }}
                refreshAssitant={refreshAssitant}
              />
              <ChatBox
                onInputMessage={(message: CreateMessage | MessageClient) => {
                  if (message.id) {
                    refreshAssitant(message as MessageClient, true)
                  } else {
                    appendMessage(chapter?.id!, message as CreateMessage)
                  }
                }}
                isStreaming={status === "streaming"}
              />
            </div>
          </div>
          <ChapterContent
            chat={{ ...chat, messages }}
            onMessageChange={setActiveMessage}
            isShowing={!!activeMessage}
            message={activeMessage as Message}
          />
        </div>
      </main>
    </div>
  );
}