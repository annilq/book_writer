"use client";

import { ChevronLeftIcon, ChevronRightIcon, SaveIcon } from "lucide-react";
import { cn, splitByFirstCodeFence, extractFirstCodeBlock } from "@/utils";
import { Button } from "@/components/ui/button";
import { Chat, Message } from "../../../books/[id]/page";
import OutlinePreview from "./outline-preview";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { useTranslation } from "react-i18next"
import { createBookOutline } from "@/app/api/chat/actions";
import { useRouter } from "next/navigation";

export default function OutlineViewerLayout({
  chat,
  message,
  onMessageChange,
  isShowing,
}: {
  chat: Chat;
  message?: Message;
  onMessageChange: (v: Message) => void;
  isShowing: boolean,
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
      className={cn(`h-full hidden overflow-hidden transition-[width] lg:flex bg-muted relative flex-col`, isShowing ? "w-3/5 border-l" : "w-0", chat.step === "CHAPTER" ? "flex-1" : "")}
    >
      <OutlinePreview />
      {chat.step === "OUTLINE" && <div className="flex items-center justify-between border-t border-gray-300 px-4 py-4 h-10 w-full bg-background">
        <div className="flex items-center justify-end gap-3">
          {previousMessage ? (
            <button
              className="text-foreground"
              onClick={() => onMessageChange(previousMessage)}
            >
              <ChevronLeftIcon className="size-4" />
            </button>
          ) : (
            <button className="text-foreground opacity-25" disabled>
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
              className="text-foreground"
              onClick={() => onMessageChange(nextMessage)}
            >
              <ChevronRightIcon className="size-4" />
            </button>
          ) : (
            <button className="text-foreground opacity-25" disabled>
              <ChevronRightIcon className="size-4" />
            </button>
          )}
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <SaveIcon className="h-4 w-4" />
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
      </div>}
    </div>
  );
}
