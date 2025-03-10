"use client";

import { useState } from "react";
import { EventStreamContentType, fetchEventSource } from "@microsoft/fetch-event-source";

import { ChevronsLeft } from "lucide-react";
import { CreateMessage, Message, useChat } from "@ai-sdk/react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from 'uuid';

import { Button } from "@/components/ui/button";
import { createMessage } from "@/app/api/chat/actions";

import BookHeader from "./components/chat-header";
import Sidebar from "../components/Sidebar";
import { SettingsModal } from "./components/setting-modal";
import ChatBox from "./components/chat-box";
import ChatLog from "./components/chat-log";
import OutlineViewerLayout from "./components/book-viewer-layout";
import type { Chat } from "./page";
import { cn } from "@/utils";

import { Message as MessageClient } from '@prisma/client'
import { AIMessageChunk } from "@langchain/core/messages";

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

  const refreshAssitant = async (message: MessageClient & { model?: string }) => {
    let aiMessage: AIMessageChunk | null = null;
    await fetchEventSource("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify({
        model: message.model,
        chatId: chat.id,
        messages,
        messageId: message.id
      }),
      onmessage: (message) => {
        if (message.event !== "data") return;
        const eventSourceMessage = JSON.parse(message.data);

        if (!eventSourceMessage.data.chunk) return;

        if (eventSourceMessage.event === "on_chat_model_stream") {
          if (aiMessage) {
            aiMessage = aiMessage.concat(new AIMessageChunk(eventSourceMessage.data.chunk));
          } else {
            aiMessage = new AIMessageChunk(eventSourceMessage.data.chunk);
          }
          console.log(aiMessage?.content);

          // setMessages((prevState) => [
          //   ...(prevState.at(-1)?.role === "user" ? prevState : prevState.slice(0, -1)),
          //   {
          //     id: messageId,
          //     role: "assistant",
          //     content: aiMessage?.content,
          //   },
          // ]);
        }
      },
      onerror: (err) => {
        console.log(err);
      },
    });
  };

  const appendMessage = async (message: CreateMessage) => {
    const updateMessage = await createMessage(chat.id, message) as Message
    const messageId = uuidv4()
    await fetchEventSource("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify({
        model: chat.model,
        chatId: chat.id,
        messages,
        messageId: updateMessage.id
      }),
      onmessage: (message) => {
        if (message.event !== "data") return;

        const eventSourceMessage = JSON.parse(message.data);

        if (!eventSourceMessage.data.chunk) return;

        if (eventSourceMessage.event === "on_chain_stream") {
          console.log(eventSourceMessage.data.chunk);

          setMessages((prevState) => [
            ...(prevState.at(-1)?.role === "user" ? prevState : prevState.slice(0, -1)),
            {
              id: messageId,
              role: "assistant",
              content: eventSourceMessage.data.chunk,
            },
          ]);
        }
      },
      onerror: (err) => {
        console.log(err);
      },
    });
  };

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
              onInputMessage={(message: CreateMessage) => {
                if (message.id) {
                  appendMessage(message)
                } else {
                  appendMessage(message)
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
class RetriableError extends Error { }
class FatalError extends Error { }