"use client";

import { produce } from "immer";
import { CreateMessage, Message, useChat } from "@ai-sdk/react";
import { useRouter } from "next/navigation";
import React from "react";

import { createMessage, removeMessagesAfterMessageId, updateMessage } from "@/app/api/chat/actions";

import BookHeader from "@/app/chats/[id]/components/chat-header";
import { SettingsModal } from "@/app/chats/[id]/components/setting-modal";
import ChatBox from "@/components/Chat/chat-box";
import ChatLog from "@/components/Chat/chat-log";
import OutlineViewerLayout from "@/app/chats/[id]/components/book-viewer-layout";
import type { Chat } from "./page";
import { cn } from "@/utils";

import { Message as MessageClient } from '@prisma/client'
import { useMessageStore } from "@/store/message";
import { Button } from "@/components/ui/button";
import { ChevronsRight, ChevronLeft } from "lucide-react";
import { useBookStore } from "@/store/book";
import { AssistantText } from "./components/assistant-text-render";

export default function PageClient({ chat }: { chat: Chat }) {
  
  const router = useRouter();

  const { message: activeMessage, setActiveMessage, setEditMessage } = useMessageStore()

  const { messages, status, append, reload, setMessages } = useChat({
    id: chat.id,
    api: "/api/chat",
    initialMessages: chat.messages as Message[],
    body: {
      model: chat.model,
      chatId: chat.id,
    },
    maxSteps: 5,
    async onToolCall({ toolCall, }) {
      if (toolCall.toolName === "parseBookOutline") {
        const input = toolCall.args
        console.log(input);
        return input
      }
    },
    async onFinish(message, options) {
      console.log(message);

      await createMessage(chat.id, message) as Message
      router.refresh();
    },
    onError: (e) => {
      console.log(e);

    }
  });

  const refresh = async (message: Pick<MessageClient, "id" | "content" | "model">, updateCurrentMessage: boolean = false) => {
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

  const { book, setActiveBook } = useBookStore()

  React.useEffect(() => {
    setActiveBook(chat)
  }, [chat.id, setActiveBook])

  if (!book) {
    return
  }
  return (
    <div className="flex bg-background text-foreground h-screen">
      <main className="flex flex-1 flex-col">
        <BookHeader>
          <div className="flex items-center flex-1 gap-2">
            <Button variant={"ghost"} size={"icon"} onClick={() => {
              router.back()
            }}> <ChevronLeft /> </Button>  {chat.title}
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
            <div className={cn("flex flex-col flex-1 overflow-auto min-w-min", !activeMessage && "max-w-3xl mx-auto")}>
              <ChatLog
                messages={messages}
                toolConfig={{
                  onRefresh: (message) => {
                    refresh(message)
                  },
                  onEdit(message) {
                    if (message.role === "user") {
                      setEditMessage(message)
                    } else {
                      console.log(message);
                    }
                  },
                }}
                renderAssistantText={({ messages, message, data }) => {
                  return <AssistantText message={message} messages={messages} data={data} />
                }}
              />
              <ChatBox
                onInputMessage={(message: CreateMessage | MessageClient) => {
                  if (message.id) {
                    refresh(message as MessageClient, true)
                  } else {
                    appendMessage(message as CreateMessage)
                  }
                }}
                isStreaming={status === "streaming"}
              />
            </div>
          </div>
          <OutlineViewerLayout
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