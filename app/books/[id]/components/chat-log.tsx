"use client";

import { Fragment } from "react";
import Markdown from "react-markdown";
import { StickToBottom } from "use-stick-to-bottom";
import { useClipboard } from 'use-clipboard-copy';
import { ArrowLeft, CopyCheck, Copy, Edit, ArrowRight } from "lucide-react";

import type { Chat, Message } from "../page";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { RefreashMessage } from "@/components/Refreash";
import { useMessageStore } from "@/store/message";
import { UIMessage } from "ai";
import { splitByFirstCodeFence } from "@/utils";

export default function ChatLog({
  chat,
  refreshAssitant,
}: {
  chat: Chat;
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
              />
            )}
          </Fragment>
        ))}
      </StickToBottom.Content>
    </StickToBottom>
  );
}

function UserMessage({ message, model, refreshAssitant }: { model: string, message: Message, refreshAssitant: (message: Message & { model: string }) => void }) {
  const { setEditMessage } = useMessageStore()

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
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditMessage(message)} >
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
  version,
  message,
  refreshAssitant
}: {
  title: string,
  model: string,
  version: number;
  message: UIMessage;
  refreshAssitant: (v: Message & { model: string }) => void;
}) {

  const clipboard = useClipboard({
    copiedTimeout: 600
  });
  const { message: activeMessage, setActiveMessage } = useMessageStore()

  return (
    <div>
      {message.parts.map((part, i) => {
        let contentCom = <div>{JSON.stringify(part)}</div>
        switch (part.type) {
          case "text":
            contentCom = (
              <AssistantText
                key={i}
                data={part.text}
                version={version}
                title={title}
                isActive={message.id === activeMessage?.id}
                onMessageClick={() => {
                  if (message.id !== activeMessage?.id) {
                    setActiveMessage(message as unknown as Message);
                  } else {
                    setActiveMessage(undefined);
                  }
                }}
              />)
            break;
          case "reasoning":
            <pre className="part-reasoning" key={i}>{part.reasoning}</pre>
            break;
          case "tool-invocation":
            const { toolName, toolCallId, state } = part.toolInvocation;
            if (toolName === "result" && state === "result") {
              contentCom = (
                <AssistantText
                  key={i}
                  data={part.toolInvocation.result}
                  version={version}
                  title={title}
                  isActive={message.id === activeMessage?.id}
                  onMessageClick={() => {
                    if (message.id !== activeMessage?.id) {
                      setActiveMessage(message as unknown as Message);
                    } else {
                      setActiveMessage(undefined);
                    }
                  }}
                />)
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


export const AssistantText = ({ data, version = 1, title = "", isActive = false, onMessageClick }: {
  data: string,
  version: number,
  title: string,
  isActive: boolean,
  onMessageClick?: () => void
}) => {

  const parts = splitByFirstCodeFence(data);
  // console.log(parts);

  return (
    <div className="my-4">
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
          ) : (
            <div className="my-4">
              <button
                className={`${isActive ? "bg-background" : " hover:border-gray-400 hover:bg-secondary hover:text-secondary-foreground"} inline-flex w-full items-center gap-2 rounded-lg border-4 border-gray-300 p-1.5`}
                onClick={onMessageClick}
              >
                <div
                  className={`flex size-8 items-center justify-center rounded font-bold`}
                >
                  V{version}-{title}
                </div>
                <div className="ml-auto">
                  {isActive ? <ArrowRight /> : <ArrowLeft />}
                </div>
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};