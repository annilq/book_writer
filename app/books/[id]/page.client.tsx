"use client";

import { useState } from "react";
import { produce } from "immer";
import { ChevronsLeft } from "lucide-react";
import { CreateMessage, Message, useChat } from "@ai-sdk/react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from 'uuid';

import { Button } from "@/components/ui/button";
import { createMessage, removeMessagesAfterMessageId, updateMessage } from "@/app/api/chat/actions";

import BookHeader from "./components/chat-header";
import Sidebar from "../components/Sidebar";
import { SettingsModal } from "./components/setting-modal";
import ChatBox from "./components/chat-box";
import ChatLog from "./components/chat-log";
import OutlineViewerLayout from "./components/book-viewer-layout";
import type { Chat } from "./page";
import { cn } from "@/utils";

import { Message as MessageClient } from '@prisma/client'

export default function PageClient({ chat }: { chat: Chat }) {
  const router = useRouter();

  const [isShowingCodeViewer, setIsShowingCodeViewer] = useState(
    chat.messages.some((m) => m.role === "assistant"),
  );

  const [activeMessage, setActiveMessage] = useState(
    chat.messages.filter((m) => m.role === "assistant").at(-1),
  );

  const { messages, status, append, reload, setMessages } = useChat({
    id: chat.id,
    api: "/api/chat",
    initialMessages: chat.messages as Message[],
    body: {
      model: chat.model,
      chatId: chat.id,
    },
    async onFinish(message, options) {
      await createMessage(chat.id, message) as Message
      router.refresh();
    },
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
    removeMessagesAfterMessageId(chat.id, message.id)
  };

  const appendMessage = async (message: CreateMessage) => {
    const updateMessage = await createMessage(chat.id, message) as Message
    append(updateMessage, { body: { model: chat.model, chatId: chat.id, book: chat } })
  };

  return (
    <div className="flex bg-background text-foreground h-screen">
      <Sidebar />
      <main className="flex flex-1 overflow-auto">
        <div className="flex flex-col flex-1 w-full shrink-0 overflow-hidden lg:w-2/5">
          <BookHeader>
            <div className="flex items-center flex-1">
              {chat.title}
            </div>
            <div className="flex items-center">
              <SettingsModal book={chat} />
              {!isShowingCodeViewer &&
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsShowingCodeViewer(true)}>
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
              }
            </div>
          </BookHeader>
          <div className={cn("flex flex-col flex-1 overflow-auto min-w-min", !isShowingCodeViewer && "max-w-3xl mx-auto")}>
            <ChatLog
              chat={{ ...chat, messages }}
              activeMessage={activeMessage}
              refreshAssitant={refreshAssitant}
              onMessageClick={(message) => {
                if (message.id !== activeMessage?.id) {
                  setActiveMessage(message);
                  setIsShowingCodeViewer(true);
                } else {
                  setActiveMessage(undefined);
                  setIsShowingCodeViewer(false);
                }
              }}
            />
            <ChatBox
              onInputMessage={(message: CreateMessage | MessageClient) => {
                if (message.id) {
                  refreshAssitant(message as MessageClient, true)
                } else {
                  appendMessage(message as CreateMessage)
                }
              }}
              isStreaming={status === "streaming"}
            />
          </div>
        </div>
        <OutlineViewerLayout
          streamText={""}
          chat={{ ...chat, messages }}
          message={activeMessage}
          onMessageChange={setActiveMessage}
          isShowing={isShowingCodeViewer}
          onClose={() => {
            setActiveMessage(undefined);
            setIsShowingCodeViewer(false);
          }}
        />
      </main>
    </div>
  );
}