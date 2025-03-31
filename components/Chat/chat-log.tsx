"use client";

import { Fragment, useState } from "react";
import { StickToBottom } from "use-stick-to-bottom";
import { useClipboard } from 'use-clipboard-copy';
import { CopyCheck, Copy, FilePenLine, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { RefreashMessage } from "@/components/Refreash";
import { UIMessage } from "ai";
import { ForwardRefEditor } from "@/components/Editor/ForwardRefEditor";
import { Message } from "@prisma/client";

export interface ToolbarActions {
  onRefresh: (message: Pick<Message, "id" | "content" | "model">) => void
  onEdit?: (message: UIMessage | Message) => void
  onSave?: (message: Message | Message) => void
  action?: (message: UIMessage | Message) => React.ReactNode
  markdownEditable?: boolean
}

export default function ChatLog({
  messages = [],
  renderAssistantText,
  toolConfig
}: {
  messages: UIMessage[];
  renderAssistantText?: ({ data, messages, message }: { data: string, messages: UIMessage[], message: UIMessage }) => React.ReactNode;
  toolConfig?: ToolbarActions
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
              <UserMessage message={message} toolConfig={toolConfig} />
            ) : (
              <AssistantMessage
                messages={messages}
                message={message}
                renderAssistantText={renderAssistantText}
                toolConfig={toolConfig}
              />
            )}
          </Fragment>
        ))}
      </StickToBottom.Content>
    </StickToBottom>
  );
}

export function UserMessage({ message, toolConfig }: { message: UIMessage, toolConfig?: ToolbarActions }) {

  return (
    <div className="self-end  max-w-[80%]">
      <TextRender
        message={message}
        data={message.content}
        toolConfig={toolConfig}
      />
    </div>
  );
}

export function AssistantMessage({
  messages,
  message,
  renderAssistantText,
  toolConfig
}: {
  messages: UIMessage[],
  message: UIMessage;
  renderAssistantText?: ({ data, messages, message }: { data: string, messages: UIMessage[], message: UIMessage, toolConfig?: ToolbarActions }) => React.ReactNode;
  toolConfig?: ToolbarActions
}) {

  return (
    <div>
      {message.parts.map((part, i) => {
        let contentCom: React.ReactNode = <div>{JSON.stringify(part)}</div>
        switch (part.type) {
          case "text":
            contentCom = renderAssistantText ? renderAssistantText({ message, messages, data: part.text, toolConfig }) : (
              <TextRender
                message={message}
                messages={messages}
                data={part.text}
                toolConfig={toolConfig}
              />)
            break;
          case "reasoning":
            <pre className="part-reasoning" key={i}>{part.reasoning}</pre>
            break;
          case "tool-invocation":
            const { toolName, toolCallId, state } = part.toolInvocation;
            if (toolName === "result" && state === "result") {
              contentCom = renderAssistantText ? renderAssistantText({ message, messages, data: part.toolInvocation.result, toolConfig }) : (
                <TextRender
                  message={message}
                  messages={messages}
                  data={part.toolInvocation.result}
                  toolConfig={toolConfig}
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

export const TextRender = ({ data, message, toolConfig }: {
  data: string,
  messages?: UIMessage[];
  message: UIMessage;
  toolConfig?: ToolbarActions
}) => {

  const [editAble, setEditAble] = useState(false)

  const clipboard = useClipboard({
    copiedTimeout: 600
  });

  return (
    <>
      <ForwardRefEditor markdown={data} readOnly={!editAble} key={data} />
      {toolConfig ? (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => clipboard.copy(data)}>
            {clipboard.copied ? <CopyCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
          {editAble ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                toolConfig.onEdit?.(message)
                setEditAble(!editAble)
              }
              }>
              <Save className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (toolConfig.markdownEditable) {
                  setEditAble(!editAble)
                } else {
                  toolConfig.onEdit?.(message)
                }
              }
              }>
              <FilePenLine className="h-4 w-4" />
            </Button>)}
          <RefreashMessage refresh={(model) => toolConfig.onRefresh({ ...message, model })} />
          {toolConfig.action?.(message)}
        </div>
      ) : false}
    </>
  );
};