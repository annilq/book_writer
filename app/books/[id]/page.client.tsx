"use client";

import { useState } from "react";

import ChatBox from "./components/chat-box";
import ChatLog from "./components/chat-log";
import OutlineViewerLayout from "./components/book-viewer-layout";
import type { Chat } from "./page";
import { CreateMessage, Message, useChat } from "@ai-sdk/react";
import { useRouter } from "next/navigation";
import BookHeader from "./components/chat-header";
import Sidebar from "../components/Sidebar";
import { SettingsModal } from "./components/setting-modal";
import { ChevronsLeft } from "lucide-react";
import { cn } from "@/utils";
import { Button } from "@/components/ui/button";
import { createMessage } from "@/app/api/chat/actions";

export default function PageClient({ chat }: { chat: Chat }) {
  const router = useRouter();

  const [isShowingCodeViewer, setIsShowingCodeViewer] = useState(
    chat.messages.some((m) => m.role === "assistant"),
  );

  const [activeMessage, setActiveMessage] = useState(
    chat.messages.filter((m) => m.role === "assistant").at(-1),
  );

  const { messages, status, append, reload } = useChat({
    id: chat.id,
    api: "/api/chat",
    initialMessages: chat.messages as Message[],
    body: {
      model: chat.model,
      chatId: chat.id,
    },
    async onFinish(message, options) {
      const updateMessage = await createMessage(chat.id, message) as Message
      router.refresh();
    },
  });

  const refreshAssitant = async (message: Message & { model?: string }) => {

    reload({
      body: {
        model: message.model,
        chatId: chat.id,
        messages,
        messageId: message.id
      }
    })
  }

  const appendMessage = async (message: CreateMessage) => {
    const updateMessage = await createMessage(chat.id, message) as Message
    append(updateMessage, { body: { model: chat.model, chatId: chat.id } })
  }

  return (
    <div className="flex bg-background text-foreground h-screen">
      <Sidebar />
      <main className="flex flex-1 overflow-auto">
        <div className="flex flex-col flex-1 w-full shrink-0 overflow-hidden lg:w-1/2">
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
          <div className={cn("flex flex-col flex-1 overflow-auto", !isShowingCodeViewer && "max-w-3xl mx-auto")}>
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
              onNewStreamPromise={(message: CreateMessage) => {
                appendMessage(message)
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
