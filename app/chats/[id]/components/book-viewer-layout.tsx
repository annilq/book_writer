"use client";

import { ChevronLeftIcon, ChevronRightIcon, SaveIcon } from "lucide-react";
import { cn, splitByFirstCodeFence, extractFirstCodeBlock } from "@/utils";
import { Button } from "@/components/ui/button";
import OutlinePreview from "./outline-preview";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { useTranslation } from "react-i18next"
import { createBookOutline } from "@/app/api/chat/actions";
import { useRouter } from "next/navigation";
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
      className={cn(`h-full hidden overflow-hidden transition-[width] lg:flex bg-muted/30 relative flex-col`, isShowing ? "w-3/5 border-l border-border" : "w-0", chat.step === "CHAPTER" ? "flex-1" : "")}
    >
      <div className="flex items-center justify-between border-b border-border bg-background/60 px-4 py-2.5 backdrop-blur">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <span className="h-4 w-1 rounded-full bg-brand" />
          Outline
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-brand hover:bg-brand/10 hover:text-brand">
              <SaveIcon className="h-4 w-4" />
              {t("save")}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("booklineConfirmTip")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("booklineConfirmContent")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
              <AlertDialogAction onClick={async () => {
                const app = extractFirstCodeBlock(message!.content)!;
                const outline = JSON.parse(app.code)
                const result = await createBookOutline(chat.id, outline)
                router.replace(`/content/${chat.id}`);
              }}>{t("save")}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <OutlinePreview onRequestFix={onRequestFix} />

      {chat.step === "OUTLINE" && (
        <div className="flex items-center justify-between border-t border-border bg-background/60 px-4 py-2.5 backdrop-blur">
          <div className="flex items-center gap-1">
            <button
              onClick={() => previousMessage && onMessageChange(previousMessage)}
              disabled={!previousMessage}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-brand/10 hover:text-brand disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
            >
              <ChevronLeftIcon className="size-4" />
            </button>
            <p className="px-1 text-sm tabular-nums text-muted-foreground">
              <span className="font-medium text-foreground">{currentVersion + 1}</span>
              {" / "}
              {Math.max(currentVersion + 1, assistantMessages.length)}
            </p>
            <button
              onClick={() => nextMessage && onMessageChange(nextMessage)}
              disabled={!nextMessage}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-brand/10 hover:text-brand disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
            >
              <ChevronRightIcon className="size-4" />
            </button>
          </div>
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Version</span>
        </div>
      )}
    </div>
  );
}
