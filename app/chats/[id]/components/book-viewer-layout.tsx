"use client";

import { ChevronLeftIcon, ChevronRightIcon, SaveIcon } from "lucide-react";
import { cn, splitByFirstCodeFence, extractFirstCodeBlock } from "@/utils";
import { Button } from "@/components/ui/button";
import OutlinePreview from "./outline-preview";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useTranslation } from "react-i18next"
import { createBookOutline } from "@/app/api/chat/actions";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { Chat, Message } from "../page";

export default function OutlineViewerLayout({
  chat,
  message,
  onMessageChange,
  isShowing,
  onRequestFix
}: {
  chat: Chat;
  message?: Message;
  onMessageChange: (v: Message) => void;
  isShowing: boolean,
  onRequestFix: (message: string) => void
}) {
  const { t } = useTranslation()

  const router = useRouter();

  const assistantMessages = chat.messages.filter((m) => m.role === "assistant");
  const currentVersion =
    message
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
      className={cn(`h-full hidden overflow-hidden transition-[width] lg:flex bg-secondary relative flex-col`, isShowing ? "w-3/5 border-l" : "w-0", chat.step === "CHAPTER" ? "flex-1" : "")}
    >
      <OutlinePreview onRequestFix={onRequestFix} />
      {chat.step === "OUTLINE" && <div className="flex items-center justify-between border-t px-4 py-4 h-10 w-full bg-background">
        <div className="flex items-center justify-end gap-3">
          {previousMessage ? (
            <button
              className="text-foreground"
              aria-label={t("prevVersion")}
              onClick={() => onMessageChange(previousMessage)}
            >
              <ChevronLeftIcon className="size-4" />
            </button>
          ) : (
            <button className="text-foreground opacity-25" aria-label={t("prevVersion")} disabled>
              <ChevronLeftIcon className="size-4" />
            </button>
          )}

          <p className="text-sm">
            Version <span className="tabular-nums">{currentVersion + 1}</span>{" "}
            <span className="text-muted-foreground">of</span>{" "}
            <span className="tabular-nums">
              {Math.max(currentVersion + 1, assistantMessages.length)}
            </span>
          </p>

          {nextMessage ? (
            <button
              className="text-foreground"
              aria-label={t("nextVersion")}
              onClick={() => onMessageChange(nextMessage)}
            >
              <ChevronRightIcon className="size-4" />
            </button>
          ) : (
            <button className="text-foreground opacity-25" aria-label={t("nextVersion")} disabled>
              <ChevronRightIcon className="size-4" />
            </button>
          )}
        </div>
        <ConfirmDialog
          title={t("booklineConfirmTip")}
          description={t("booklineConfirmContent")}
          actionLabel={t("save")}
          trigger={
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={t("save")}>
              <SaveIcon className="h-4 w-4" />
            </Button>
          }
          onConfirm={async () => {
            try {
              const app = extractFirstCodeBlock(message!.content)!
              if (!app?.code) {
                throw new Error("no-outline")
              }
              const outline = JSON.parse(app.code)
              await createBookOutline(chat.id, outline)
              router.replace(`/content/${chat.id}`);
            } catch {
              toast({ title: t("jsonParseError") })
              onRequestFix(message!.content)
            }
          }}
        />
      </div>}
    </div>
  );
}
