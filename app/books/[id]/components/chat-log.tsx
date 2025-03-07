"use client";

import { splitByFirstCodeFence } from "@/utils";
import type { Chat, Message } from "../page";
import { Fragment } from "react";
import Markdown from "react-markdown";
import { StickToBottom } from "use-stick-to-bottom";
import { ArrowLeft, Copy, Edit } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { RefreashMessage } from "@/components/Refreash";

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
      className="relative grow overflow-hidden"
      resize="smooth"
      initial="smooth"
    >
      <StickToBottom.Content className="mx-auto flex w-full flex-col gap-8 p-4 text-sm">
        {chat.messages.slice(1).map((message) => (
          <Fragment key={message.id}>
            {message.role === "user" ? (
              <UserMessage model={chat.model} message={message} refreshAssitant={refreshAssitant} />
            ) : (
              <AssistantMessage
                model={chat.model}
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
  return (
    <div className="self-end  max-w-[80%]">
      <div className="relative inline-flex items-end">
        <div className="whitespace-pre-wrap rounded bg-background text-foreground p-2">
          {message.content}
        </div>
        <Avatar className="bg-slate-500 text-background items-center justify-center">User</Avatar>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Copy className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Edit className="h-4 w-4" />
        </Button>
        <RefreashMessage model={model} refreshAssitant={(model) => refreshAssitant({ ...message, model })} />
      </div>
    </div>
  );
}

function AssistantMessage({
  model,
  content,
  version,
  message,
  isActive,
  onMessageClick = () => { },
  refreshAssitant
}: {
  model: string,
  content: string;
  version: number;
  message?: Message;
  isActive?: boolean;
  onMessageClick?: (v: Message) => void;
  refreshAssitant: (v: Message & { model: string }) => void;
}) {
  const parts = splitByFirstCodeFence(content);

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
                <div className="flex size-8 items-center justify-center rounded bg-gray-300 font-bold">
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
                className={`${isActive ? "bg-white" : "bg-gray-300 hover:border-gray-400 hover:bg-gray-400"} inline-flex w-full items-center gap-2 rounded-lg border-4 border-gray-300 p-1.5`}
                onClick={() => onMessageClick(message)}
              >
                <div
                  className={`${isActive ? "bg-gray-300" : "bg-gray-200"} flex size-8 items-center justify-center rounded font-bold`}
                >
                  V{version}
                </div>
                <div className="flex flex-col gap-0.5 text-left leading-none">
                  <div className="text-sm font-medium leading-none">
                    {toTitleCase(part.filename.name)}{" "}
                    {version !== 1 && `v${version}`}
                  </div>
                  <div className="text-xs leading-none text-gray-500">
                    {part.filename.name}
                    {version !== 1 && `-v${version}`}
                    {"."}
                    {part.filename.extension}
                  </div>
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
                <div className="flex size-8 items-center justify-center rounded bg-gray-300 font-bold">
                  V{version}
                </div>
                <div className="flex flex-col gap-0.5 text-left leading-none">
                  <div className="text-sm font-medium leading-none">
                    {toTitleCase(part.filename.name)}{" "}
                    {version !== 1 && `v${version}`}
                  </div>
                  <div className="text-xs leading-none text-gray-500">
                    {part.filename.name}
                    {version !== 1 && `-v${version}`}
                    {"."}
                    {part.filename.extension}
                  </div>
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
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Copy className="h-4 w-4" />
        </Button>
        <RefreashMessage model={model} refreshAssitant={(model) => refreshAssitant({ ...message, model })} />
      </div>
    </div>
  );
}

export function toTitleCase(rawName: string): string {
  // Split on one or more hyphens or underscores
  const parts = rawName.split(/[-_]+/);

  // Capitalize each part and join them back with spaces
  return parts
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}
