"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";

import { useMessageStore } from "@/store/message";
import { UIMessage } from "ai";
import { splitByFirstCodeFence } from "@/utils";
import { useBookStore } from "@/store/book";
import { TextRender, ToolbarActions } from "@/components/Chat/chat-log";
import { Message } from "@prisma/client";

const VersionCard = ({ messages, message, isActive = false, onMessageClick }: {
  messages: UIMessage[];
  message: UIMessage;
  isActive: boolean,
  onMessageClick?: () => void
}) => {

  const { book } = useBookStore()
  const assistantMessages = messages.filter((m) => m.role === "assistant");
  const version = assistantMessages.map((m) => m.id).indexOf(message.id) + 1

  return (
    <div className="my-4">
      <button
        className={`${isActive ? "bg-background" : " hover:border-gray-400 hover:bg-secondary hover:text-secondary-foreground"} inline-flex w-full items-center gap-2 rounded border-4 border-gray-300 p-1.5`}
        onClick={onMessageClick}
      >
        <div
          className={`flex items-center justify-center rounded font-bold`}
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

const StreamingCard = ({ messages, message }: {
  messages: UIMessage[];
  message: UIMessage;
}) => {

  const assistantMessages = messages.filter((m) => m.role === "assistant");
  const version = assistantMessages.map((m) => m.id).indexOf(message.id) + 1

  return (
    <div className="my-4">
      <button
        disabled
        className="inline-flex w-full animate-pulse items-center gap-2 rounded border-4 border-gray-300 p-1.5"
      >
        <div className="flex items-center justify-center rounded font-bold">
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

export const AssistantText = ({ messages, message, data, toolConfig}: {
  messages: UIMessage[];
  message: UIMessage;
  data: string,
  toolConfig?: ToolbarActions

}) => {

  const parts = splitByFirstCodeFence(data);
  // console.log(parts);
  const { message: activeMessage, setActiveMessage } = useMessageStore()
  const onMessageClick = () => {
    if (message.id !== activeMessage?.id) {
      setActiveMessage(message as unknown as Message);
    } else {
      setActiveMessage(undefined);
    }
  }

  return (
    <>
      {parts.map((part, i) => (
        <div key={part.content}>
          {part.type === "text" ? (
            <TextRender data={part.content} message={message} toolConfig={toolConfig} />
          ) : part.type === "first-code-fence-generating" ? (
            <StreamingCard
              messages={messages}
              message={message}
            />
          ) : (
            <VersionCard
              messages={messages}
              message={message}
              onMessageClick={onMessageClick}
              isActive={message.id === activeMessage?.id} />
          )}
        </div>
      ))}
    </>
  );
};