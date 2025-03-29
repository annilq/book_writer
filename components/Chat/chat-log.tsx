"use client";

import { Fragment } from "react";
import { StickToBottom } from "use-stick-to-bottom";
import { useClipboard } from 'use-clipboard-copy';
import { CopyCheck, Copy, FilePenLine } from "lucide-react";

import type { Message } from "../../app/books/[id]/page";

import { Button } from "@/components/ui/button";
import { RefreashMessage } from "@/components/Refreash";
import { useMessageStore } from "@/store/message";
import { UIMessage } from "ai";
import { ForwardRefEditor } from "@/components/Editor/ForwardRefEditor";

export default function ChatLog({
  messages = [],
  refresh,
  renderAssistantText,
  action
}: {
  messages: UIMessage[];
  refresh: (v: Message & { model: string }) => void;
  renderAssistantText?: ({ data, messages, message }: { data: string, messages: UIMessage[], message: UIMessage }) => React.ReactNode;
  // renderMessageToolBar?: ({ data, messages, message }: { data: string, messages: UIMessage[], message: UIMessage }) => React.ReactNode;
  action?: (content: string) => React.ReactNode;
}) {

  return (
    <StickToBottom
      className="relative grow overflow-hidden chat-log"
      resize="smooth"
      initial="smooth"
    >
      <StickToBottom.Content className="mx-auto flex w-full flex-col gap-4 p-4 text-sm">
        {messages.filter(message => message.role !== "system").map((message) => (
          <Fragment key={message.id}>
            {message.role === "user" ? (
              <UserMessage message={message} refresh={refresh} />
            ) : (
              <AssistantMessage
                messages={messages}
                message={message}
                refresh={refresh}
                action={action}
                renderAssistantText={renderAssistantText}
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

  return (
    <div className="self-end  max-w-[80%]">
      <ForwardRefEditor markdown={message.content} readOnly className="whitespace-pre-wrap rounded bg-background text-foreground p-2 flex-1" />
      <AssistantToolBar
        data={message.content}
        onRefresh={(model) => refresh({ ...message, model })}
        onEdit={() => setEditMessage(message)}
      />
    </div>
  );
}

export function AssistantMessage({
  messages,
  message,
  refresh,
  action,
  renderAssistantText
}: {
  messages: UIMessage[],
  message: UIMessage;
  refresh: (v: Message & { model: string }) => void;
  action?: (content: string) => React.ReactNode;
  renderAssistantText?: ({ data, messages, message }: { data: string, messages: UIMessage[], message: UIMessage }) => React.ReactNode;
}) {

  return (
    <div>
      {message.parts.map((part, i) => {
        let contentCom: React.ReactNode = <div>{JSON.stringify(part)}</div>
        switch (part.type) {
          case "text":
            contentCom = renderAssistantText ? renderAssistantText({ message, messages, data: part.text }) : (
              <AssistantTextRender
                message={message}
                messages={messages}
                data={part.text}
                onRefresh={(model) => refresh({ ...message, model })}
                action={action}
              />)
            break;
          case "reasoning":
            <pre className="part-reasoning" key={i}>{part.reasoning}</pre>
            break;
          case "tool-invocation":
            const { toolName, toolCallId, state } = part.toolInvocation;
            if (toolName === "result" && state === "result") {
              contentCom = renderAssistantText ? renderAssistantText({ message, messages, data: part.toolInvocation.result }) : (
                <AssistantTextRender
                  message={message}
                  messages={messages}
                  data={part.toolInvocation.result}
                  onRefresh={(model) => refresh({ ...message, model })}
                  action={action}
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

export const AssistantTextRender = ({ data, onEdit, onRefresh, action }: {
  data: string,
  onRefresh: (model: string) => void
  messages?: UIMessage[];
  message?: UIMessage;
  onEdit?: () => void
  action?: (content: string) => React.ReactNode
}) => {  
  return (
    <>
      <ForwardRefEditor markdown={data} readOnly key={data} />
      <AssistantToolBar onRefresh={onRefresh} action={action} data={data} />
    </>
  );
};

export const AssistantToolBar = ({ data, onEdit, onRefresh, action }: {
  data: string,
  // message: Message,
  onRefresh: (model: string) => void
  onEdit?: () => void
  action?: (content: string) => React.ReactNode
}) => {

  const clipboard = useClipboard({
    copiedTimeout: 600
  });

  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="icon" onClick={() => clipboard.copy(data)}>
        {clipboard.copied ? <CopyCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </Button>
      {onEdit ? <Button variant="ghost" size="icon" onClick={() => onEdit()}>
        <FilePenLine className="h-4 w-4" />
      </Button> : false}
      <RefreashMessage refresh={onRefresh} />
      {action?.(data)}
    </div>
  );
};