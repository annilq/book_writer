"use client";

import { Fragment } from "react";
import Markdown from "react-markdown";
import { StickToBottom } from "use-stick-to-bottom";
import { useClipboard } from 'use-clipboard-copy';
import { ArrowLeft, CopyCheck, Copy, Edit } from "lucide-react";

import type { Chat, Message } from "../page";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { RefreashMessage } from "@/components/Refreash";
import { useMessageStore } from "@/store/message";
import { UIMessage } from "ai";
import { Chapter } from "@prisma/client";
import { ChapterInput } from "@/utils";

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


type BookOutlineProps = {
  data: ChapterInput[];
};

export const BookOutlineCard = ({ data }: BookOutlineProps) => {
  return (
    <div>
      <h2>BookOutlineCard Information</h2>
    </div>
  );
};

function AssistantMessage({
  title,
  model,
  version,
  message,
  isActive,
  onMessageClick = () => { },
  refreshAssitant
}: {
  title: string,
  model: string,
  version: number;
  message: UIMessage;
  isActive?: boolean;
  onMessageClick?: (v: Message) => void;
  refreshAssitant: (v: Message & { model: string }) => void;
}) {

  const clipboard = useClipboard({
    copiedTimeout: 600
  });

  return (
    <div>
      {message.parts.map((part, i) => {
        console.log(part);
        let contentCom = <div>{JSON.stringify(part)}</div>
        switch (part.type) {
          case "text":
            contentCom = <Markdown className="part-text">{part.text}</Markdown>
            break;
          case "reasoning":
            <pre  className="part-reasoning">{part.reasoning}</pre>
            break;
          case "tool-invocation":
            const { toolName, toolCallId, state, result } = part.toolInvocation;
            if (toolName === "result" && state === "result") {
              contentCom = <BookOutlineCard key={toolCallId} data={result} />
            }
            break;
          default:
            break;
        }
        return (
          <div key={i}>
            {contentCom}
          </div>
        )
      })}

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => clipboard.copy(content)}>
          {clipboard.copied ? <CopyCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
        <RefreashMessage model={model} refreshAssitant={(model) => refreshAssitant({ ...message, model })} />
      </div>
    </div>
  );
}

