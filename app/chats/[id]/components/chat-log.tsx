"use client";

import { Fragment } from "react";
import { StickToBottom } from "use-stick-to-bottom";
import { useClipboard } from 'use-clipboard-copy';
import { ArrowLeft, CopyCheck, Copy, Edit, ArrowRight, FilePenLine, Check } from "lucide-react";

import type { Message } from "../../../books/[id]/page";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { RefreashMessage } from "@/components/Refreash";
import { useMessageStore } from "@/store/message";
import { UIMessage } from "ai";
import { splitByFirstCodeFence } from "@/utils";
import { ForwardRefEditor } from "@/components/Editor/ForwardRefEditor";
import { useBookStore } from "@/store/book";

export default function ChatLog({
  messages = [],
  refresh,
  onSave
}: {
  messages: UIMessage[];
  refresh: (v: Message & { model: string }) => void;
  onSave?: (content: string) => void;
}) {
  const { message: activeMessage, setActiveMessage } = useMessageStore()

  return (
    <StickToBottom
      className="relative grow overflow-hidden chat-log"
      resize="smooth"
      initial="smooth"
    >
      <StickToBottom.Content className="mx-auto flex w-full flex-col gap-8 p-4 text-sm">
        {messages.filter(message => message.role !== "system").map((message) => (
          <Fragment key={message.id}>
            {message.role === "user" ? (
              <UserMessage message={message} refresh={refresh} />
            ) : (
              <AssistantMessage
                refresh={refresh}
                messages={messages}
                message={message}
                isActive={message.id === activeMessage?.id}
                onSave={onSave}
                onMessageClick={() => {
                  if (message.id !== activeMessage?.id) {
                    setActiveMessage(message as unknown as Message);
                  } else {
                    setActiveMessage(undefined);
                  }
                }}
              />
            )}
          </Fragment>
        ))}
      </StickToBottom.Content>
    </StickToBottom>
  );
}

export function UserMessage({ message, refresh }: { message: UIMessage, refresh: (message: Message & { model: string }) => void }) {
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
        <RefreashMessage refresh={(model) => refresh({ ...message, model })} />
      </div>
    </div>
  );
}


function AssistantMessage({
  isActive,
  messages,
  message,
  refresh,
  onMessageClick,
  onSave
}: {
  isActive: boolean,
  messages: UIMessage[],
  message: UIMessage;
  refresh: (v: Message & { model: string }) => void;
  onMessageClick: () => void;
  onSave?: (content: string) => void;
}) {

  const assistantMessages = messages.filter((m) => m.role === "assistant");
  const version = assistantMessages.map((m) => m.id).indexOf(message.id) + 1

  return (
    <div>
      {message.parts.map((part, i) => {
        let contentCom = <div>{JSON.stringify(part)}</div>
        switch (part.type) {
          case "text":
            contentCom = (
              <AssistantText
                refresh={(model) => refresh({ ...message, model })}
                key={i}
                data={part.text}
                version={version}
                isActive={isActive}
                onMessageClick={onMessageClick}
                onSave={onSave}
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
                  refresh={(model) => refresh({ ...message, model })}
                  data={part.toolInvocation.result}
                  version={version}
                  isActive={isActive}
                  onMessageClick={onMessageClick}
                  onSave={onSave}
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
    </div>
  );
}


export const AssistantText = ({ data, version = 1, isActive = false, onMessageClick, refresh, onSave }: {
  data: string,
  version: number,
  isActive: boolean,
  refresh: (model: string) => void
  onMessageClick?: () => void
  onSave?: (content: string) => void
}) => {

  const parts = splitByFirstCodeFence(data);
  // console.log(parts);
  const clipboard = useClipboard({
    copiedTimeout: 600
  });

  return (
    <div className="my-4">
      {parts.map((part, i) => (
        <div key={part.content}>
          {part.type === "text" ? (
            <>
              <ForwardRefEditor markdown={part.content} readOnly />
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => clipboard.copy(part.content)}>
                  {clipboard.copied ? <CopyCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>

                <Button variant="ghost" size="icon" onClick={onMessageClick}>
                  <FilePenLine className="h-4 w-4" />
                </Button>
                <RefreashMessage refresh={refresh} />
                {onSave && (
                  <div className="flex flex-1 justify-end">
                    <Button variant="ghost" size="icon" onClick={() => onSave(part.content)}>
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                )
                }
              </div>
            </>
          ) : part.type === "first-code-fence-generating" ? (
            <StreamingCard version={version} />
          ) : (
            <VersionCard onMessageClick={onMessageClick} version={version} isActive={isActive} />
          )}
        </div>
      ))}
    </div>
  );
};

export const VersionCard = ({ version = 1, isActive = false, onMessageClick }: {
  version: number,
  isActive: boolean,
  onMessageClick?: () => void
}) => {
  const { book } = useBookStore()

  return (
    <div className="my-4">
      <button
        className={`${isActive ? "bg-background" : " hover:border-gray-400 hover:bg-secondary hover:text-secondary-foreground"} inline-flex w-full items-center gap-2 rounded-lg border-4 border-gray-300 p-1.5`}
        onClick={onMessageClick}
      >
        <div
          className={`flex size-8 items-center justify-center rounded font-bold`}
        >
          V{version}-{book!.title}
        </div>
        <div className="ml-auto">
          {isActive ? <ArrowRight /> : <ArrowLeft />}
        </div>
      </button>
    </div>
  )
}
export const StreamingCard = ({ version = 1 }: {
  version: number,
}) => {
  return (
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
  )
}