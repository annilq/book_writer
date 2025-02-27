"use client";


import type { Chat, Message } from "../page";
import { StickToBottom } from "use-stick-to-bottom";
import { extractFirstCodeBlock, extractJsonCodeFromMarkdown, splitByFirstCodeFence } from "@/utils";
import { ChevronLeftIcon, ChevronRightIcon, CircleX } from "lucide-react";


export default function CodeViewer({
  chat,
  streamText = "",
  message,
  onMessageChange,
  onClose,
}: {
  chat: Chat;
  streamText: string;
  message?: Message;
  onMessageChange: (v: Message) => void;
  activeTab: string;
  onTabChange: (v: "code" | "preview") => void;
  onClose: () => void;
  onRequestFix: (e: string) => void;
}) {
  const streamAppParts = extractJsonCodeFromMarkdown(streamText);

  const assistantMessages = chat.messages.filter((m) => m.role === "assistant");
  const currentVersion = streamApp
    ? assistantMessages.length
    : message
      ? assistantMessages.map((m) => m.id).indexOf(message.id)
      : 1;
  const previousMessage =
    currentVersion !== 0 ? assistantMessages.at(currentVersion - 1) : undefined;
  const nextMessage =
    currentVersion < assistantMessages.length
      ? assistantMessages.at(currentVersion + 1)
      : undefined;


  return (
    <>
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-300 px-4">
        <div className="inline-flex items-center gap-4">
          <button
            className="text-gray-400 hover:text-gray-700"
            onClick={onClose}
          >
            <CircleX className="size-5" />
          </button>
          <span>
            {chat.title} v{currentVersion + 1}
          </span>
        </div>
      </div>
      <div className="flex grow flex-col overflow-y-auto bg-white">
        <StickToBottom
          className="relative grow overflow-hidden"
          resize="smooth"
          initial={streamAppIsGenerating ? "smooth" : false}
        >
          <StickToBottom.Content>
            {code}
          </StickToBottom.Content>
        </StickToBottom>

      </div>

      <div className="flex items-center justify-between border-t border-gray-300 px-4 py-4">
        <div className="flex items-center justify-end gap-3">
          {previousMessage ? (
            <button
              className="text-gray-900"
              onClick={() => onMessageChange(previousMessage)}
            >
              <ChevronLeftIcon className="size-4" />
            </button>
          ) : (
            <button className="text-gray-900 opacity-25" disabled>
              <ChevronLeftIcon className="size-4" />
            </button>
          )}

          <p className="text-sm">
            Version <span className="tabular-nums">{currentVersion + 1}</span>{" "}
            <span className="text-gray-400">of</span>{" "}
            <span className="tabular-nums">
              {Math.max(currentVersion + 1, assistantMessages.length)}
            </span>
          </p>

          {nextMessage ? (
            <button
              className="text-gray-900"
              onClick={() => onMessageChange(nextMessage)}
            >
              <ChevronRightIcon className="size-4" />
            </button>
          ) : (
            <button className="text-gray-900 opacity-25" disabled>
              <ChevronRightIcon className="size-4" />
            </button>
          )}
        </div>
      </div>
    </>
  );
}
