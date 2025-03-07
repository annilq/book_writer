"use client";

import BookHeader from "./chat-header";
import { ChevronLeftIcon, ChevronRightIcon, ChevronsRight } from "lucide-react";
import { cn, splitByFirstCodeFence, extractFirstCodeBlock } from "@/utils";
import { Button } from "@/components/ui/button";
import { StickToBottom } from "use-stick-to-bottom";
import { Chat, Message } from "../page";

export default function CodeViewerLayout({
  chat,
  streamText = "",
  message,
  onMessageChange,
  isShowing,
  onClose,
}: {
  chat: Chat;
  streamText: string;
  message?: Message;
  onMessageChange: (v: Message) => void;
  isShowing: boolean,
  onClose: () => void;
}) {
  const app = message ? extractFirstCodeBlock(message.content) : undefined;
  const streamAppParts = splitByFirstCodeFence(streamText);
  const streamApp = streamAppParts.find(
    (p) =>
      p.type === "first-code-fence-generating" || p.type === "first-code-fence",
  );
  const streamAppIsGenerating = streamAppParts.some(
    (p) => p.type === "first-code-fence-generating",
  );

  const code = streamApp ? streamApp.content : app?.code || "";
  const title = streamApp ? streamApp.filename.name : app?.filename?.name || "";

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
    <div
      className={cn(`h-full hidden overflow-hidden transition-[width] lg:block bg-muted`, isShowing ? "w-1/2 border-l" : "w-0")}
    >
      <BookHeader>
        <div className="flex items-center w-full">
          <div className="flex items-center flex-1">
            {isShowing && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                <ChevronsRight className="h-4 w-4" />
              </Button>
            )}
            <div>
              {title}
            </div>
          </div>
          {isShowing && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </BookHeader>
      <div className="flex h-full flex-col ">
        <div className="flex h-full flex-col">
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
        </div>
      </div>
    </div>
  );
}
