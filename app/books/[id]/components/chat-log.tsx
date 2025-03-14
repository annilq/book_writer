"use client";

import { Fragment } from "react";
import Markdown from "react-markdown";
import { StickToBottom } from "use-stick-to-bottom";
import { useClipboard } from 'use-clipboard-copy';
import { ArrowLeft, CopyCheck, Copy, Edit } from "lucide-react";

import { splitByFirstCodeFence } from "@/utils";
import type { Chat, Message } from "../page";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { RefreashMessage } from "@/components/Refreash";
import { useMessageStore } from "@/store/message";

export default function ChatLog({
  chat,
  activeMessage,
  onMessageClick,
  refreshAssitant,
}: {
  chat: Chat;
  activeMessage?: Message;
  onMessageClick: (v: Message) => void;
  refreshAssitant: (v: Message & { model: string }) => void;
}) {
  const assistantMessages = chat.messages.filter((m) => m.role === "assistant");

  return (
    <StickToBottom
      className="relative grow overflow-hidden chat-log"
      resize="smooth"
      initial="smooth"
    >
      <StickToBottom.Content className="mx-auto flex w-full flex-col gap-8 p-4 text-sm">
        {chat.messages.filter(message => message.role !== "system").map((message) => (
          <Fragment key={message.id}>
            {message.role === "user" ? (
              <UserMessage model={chat.model} message={message} refreshAssitant={refreshAssitant} />
            ) : (
              <AssistantMessage
                model={chat.model}
                title={chat.title}
                content={message.content}
                version={
                  assistantMessages.map((m) => m.id).indexOf(message.id) + 1
                }
                refreshAssitant={refreshAssitant}
                message={message}
                isActive={activeMessage?.id === message.id}
                onMessageClick={onMessageClick}
              />
            )}
          </Fragment>
        ))}
      </StickToBottom.Content>
    </StickToBottom>
  );
}

function UserMessage({ message, model, refreshAssitant }: { model: string, message: Message, refreshAssitant: (message: Message & { model: string }) => void }) {
  const { setMessage } = useMessageStore()

  const clipboard = useClipboard({
    copiedTimeout: 600
  });

  return (
    <div className="self-end  max-w-[80%]">
      <div className="relative inline-flex items-end w-full justify-end">
        <div className="whitespace-pre-wrap rounded bg-background text-foreground p-2 flex-1">
          {message.content}
        </div>
        <Avatar className="bg-slate-500 text-background items-center justify-center">User</Avatar>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => clipboard.copy(message.content)}>
          {clipboard.copied ? <CopyCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMessage(message)} >
          <Edit className="h-4 w-4" />
        </Button>
        <RefreashMessage model={model} refreshAssitant={(model) => refreshAssitant({ ...message, model })} />
      </div>
    </div>
  );
}

function AssistantMessage({
  title,
  model,
  content,
  version,
  message,
  isActive,
  onMessageClick = () => { },
  refreshAssitant
}: {
  title: string,
  model: string,
  content: string;
  version: number;
  message?: Message;
  isActive?: boolean;
  onMessageClick?: (v: Message) => void;
  refreshAssitant: (v: Message & { model: string }) => void;
}) {
  const parts = splitByFirstCodeFence(content);
  const clipboard = useClipboard({
    copiedTimeout: 600
  });
  return (
    <div>
      {parts.map((part, i) => (
        <div key={i}>
          {part.type === "text" ? (
            <Markdown>{part.content}</Markdown>
          ) : part.type === "first-code-fence-generating" ? (
            <div className="my-4">
              <button
                disabled
                className="inline-flex w-full animate-pulse items-center gap-2 rounded-lg border-4 border-gray-300 p-1.5"
              >
                <div className="flex size-8 items-center justify-center rounded font-bold">
                  V{version}
                </div>
                <div className="flex flex-col gap-0.5 text-left leading-none">
                  <div className="text-sm font-medium leading-none">
                    Generating...
                  </div>
                </div>
              </button>
            </div>
          ) : message ? (
            <div className="my-4">
              <button
                className={`${isActive ? "bg-background" : " hover:border-gray-400 hover:bg-gray-100"} inline-flex w-full items-center gap-2 rounded-lg border-4 border-gray-300 p-1.5`}
                onClick={() => onMessageClick(message)}
              >
                <div
                  className={`flex size-8 items-center justify-center rounded font-bold`}
                >
                  V{version}-{title}
                </div>
                <div className="ml-auto">
                  <ArrowLeft />
                </div>
              </button>
            </div>
          ) : (
            <div className="my-4">
              <button
                className="inline-flex w-full items-center gap-2 rounded-lg border-4 border-gray-300 p-1.5"
                disabled
              >
                <div className="flex size-8 items-center justify-center rounded font-bold">
                  V{version}-{title}
                </div>
                <div className="ml-auto">
                  <ArrowLeft />
                </div>
              </button>
            </div>
          )}
        </div>
      ))}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => clipboard.copy(content)}>
          {clipboard.copied ? <CopyCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
        <RefreashMessage model={model} refreshAssitant={(model) => refreshAssitant({ ...message, model })} />
      </div>
    </div>
  );
}