"use client";

import { Fragment } from "react";
import { StickToBottom } from "use-stick-to-bottom";
import { useClipboard } from 'use-clipboard-copy';
import { CopyCheck, Copy, FilePenLine } from "lucide-react";

import { Button } from "@/components/ui/button";
import { RefreashMessage } from "@/components/Refreash";
import { useMessageStore } from "@/store/message";
import { UIMessage } from "ai";
import { ForwardRefEditor } from "@/components/Editor/ForwardRefEditor";

interface ToolbarActions {
  onRefresh: (model: string) => void
  onEdit?: () => void
  onSave?: () => void
  action?: (content: string) => React.ReactNode
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
  const { setEditMessage } = useMessageStore()

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
  renderAssistantText?: ({ data, messages, message }: { data: string, messages: UIMessage[], message: UIMessage }) => React.ReactNode;
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

export const TextRender = ({ data, toolConfig }: {
  data: string,
  messages?: UIMessage[];
  message?: UIMessage;
  toolConfig?: ToolbarActions
}) => {
  return (
    <>
      <ForwardRefEditor markdown={data} readOnly key={data} />
      {toolConfig ? <AssistantToolBar data={data} {...toolConfig} /> : false}
    </>
  );
};

export const AssistantToolBar = ({ data, onEdit, onRefresh, action }: {
  data: string,
} & ToolbarActions) => {

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