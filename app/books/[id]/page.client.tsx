"use client";

import { startTransition, useState } from "react";

import ChatBox from "./chat-box";
import ChatLog from "./chat-log";
import CodeViewer from "./book-viewer";
import CodeViewerLayout from "./book-viewer-layout";
import type { Chat } from "./page";
import { CreateMessage, Message, useChat } from "ai/react";
import { useRouter } from "next/navigation";
import Sidebar from "./components/sidebar";

let didPushToCode = false;
let didPushToPreview = false;

export default function PageClient({ chat }: { chat: Chat }) {
  const router = useRouter();

  const [isShowingCodeViewer, setIsShowingCodeViewer] = useState(
    chat.messages.some((m) => m.role === "assistant"),
  );
  const [activeTab, setActiveTab] = useState<"code" | "preview">("preview");

  const [activeMessage, setActiveMessage] = useState(
    chat.messages.filter((m) => m.role === "assistant").at(-1),
  );

  const { messages, isLoading, append } = useChat({
    id: chat.id,
    api: "/api/chat",
    initialMessages: chat.messages as Message[],
    body: {
      model: chat.model,
      chatId: chat.id,
    },
    async onFinish(message, options) {
      didPushToCode = false;
      didPushToPreview = false;
      router.refresh();
    },
  });


  return (
    <div className="flex bg-background text-foreground">
      <Sidebar />
      <main className="flex flex-1 overflow-auto">
        <div className="flex w-full shrink-0 flex-col overflow-hidden lg:w-1/2">
          <ChatLog
            chat={{ ...chat, messages }}
            activeMessage={activeMessage}
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
            onNewStreamPromise={(message: CreateMessage) => append(message, { body: { model: chat.model, chatId: chat.id } })}
            isStreaming={!!isLoading}
          />
        </div>
        <CodeViewerLayout
          isShowing={isShowingCodeViewer}
          onClose={() => {
            setActiveMessage(undefined);
            setIsShowingCodeViewer(false);
          }}
        >
          {isShowingCodeViewer && (
            <CodeViewer
              streamText={""}
              chat={{ ...chat, messages }}
              message={activeMessage}
              onMessageChange={setActiveMessage}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onClose={() => {
                setActiveMessage(undefined);
                setIsShowingCodeViewer(false);
              }}
              onRequestFix={(error: string) => {
                startTransition(async () => {
                  let newMessageText = `The code is not working. Can you fix it? Here's the error:\n\n`;
                  newMessageText += error.trimStart();

                  append({ content: newMessageText, role: 'user' },
                    {
                      body: {
                        model: chat.model,
                        chatId: chat.id
                      }
                    }
                  );
                });
              }}
            />
          )}
        </CodeViewerLayout>
      </main>

    </div>
  );
}
