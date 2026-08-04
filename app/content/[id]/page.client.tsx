"use client";

import { produce } from "immer";
import { UIMessage, useChat } from "@ai-sdk/react";
import { useRouter } from "next/navigation";

import { removeChapterMessagesAfterMessageId, updateMessage } from "@/app/api/chat/actions";

import BookHeader from "@/app/chats/[id]/components/chat-header";
import Outline from "./components/outline";
import { SettingsModal } from "@/app/chats/[id]/components/setting-modal";
import ChatBox from "@/components/Chat/chat-box";
import type { Chat } from "./page";
import { cn } from "@/utils";

import { Message as MessageClient } from '@prisma/client'
import { useMessageStore } from "@/store/message";
import { Button } from "@/components/ui/button";
import { Check, ChevronLeft, ChevronsRight, Loader, Sparkles, BookOpen, X } from "lucide-react";
import ChapterContent from "./components/chapter-content";
import { createChapterMessage, MessageWithParts, saveChapterContent } from "@/app/api/chapter/actions";
import { useBookStore } from "@/store/book";
import React, { startTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next"
import ChatLog from "@/components/Chat/chat-log";
import { useChaperStore } from "@/store/chapter";

export default function PageClient({ chat, messages: initialMessages }: { chat: Chat, messages: MessageWithParts[] }) {

  const { toast } = useToast()
  const router = useRouter();
  const { t } = useTranslation()
  const [celebrate, setCelebrate] = React.useState(false)
  const celebrateDialogRef = React.useRef<HTMLDivElement>(null)
  const { message: activeMessage, setActiveMessage, setEditMessage } = useMessageStore()
  const { chapter, setChapter } = useChaperStore()

  const { messages, status, sendMessage, regenerate, setMessages, stop } = useChat({
    api: "/api/chapter",
    id: chat.id,
    messages: initialMessages.map(msg => ({
      id: msg.id,
      role: msg.role as "data" | "system" | "user" | "assistant",
      parts: [{ type: "text", text: msg.content }]
    })) as UIMessage[],
    async onFinish() {
      router.refresh();
    },
    onError: (e) => {
      // A swallowed failure leaves the author staring at a stuck screen,
      // so always say something out loud.
      console.error(e);
      toast({
        variant: "destructive",
        title: t("generationFailed"),
        description: e instanceof Error && e.message ? e.message : undefined,
      });
    }
  });

  const refresh = async (message: Pick<MessageClient, "id" | "content" | "model">, updateCurrentMessage: boolean = false) => {
    const currentMessageIndex = messages.findIndex(msg => msg.id === message.id)
    let updateMessages = messages.slice(0, currentMessageIndex + 1)
    if (updateCurrentMessage) {
      updateMessages = produce(updateMessages, draft => {
        draft[currentMessageIndex].parts = [{ type: "text", text: message.content }]
      })
    }

    setMessages(updateMessages)

    regenerate({
      body: {
        model: message.model,
        chatId: chat.id,
        book: chat,
        messages,
        messageId: message.id,
        chapterId: chapter?.id
      }
    })
    if (updateCurrentMessage) {
      updateMessage(message.id, message.content)
    }
    removeChapterMessagesAfterMessageId(chapter?.id!, message.id)
  };

  const onSave = async (message: MessageClient) => {
    const content = message.content;
    const book = await saveChapterContent(chapter?.id!, content)
    if (book?.step === "COMPLETE") {
      setCelebrate(true)
    } else {
      toast({ title: t("chapterSaved") })
      // Return to the conversation instead of blanking the screen, so the
      // author can immediately prompt the next chapter.
      setActiveMessage(undefined)
      router.refresh()
    }
  };

  const appendMessage = async (chapterId: number, message: UIMessage) => {
    const updateMessage = await createChapterMessage(chapterId, message) as MessageClient
    sendMessage(
      {
        id: updateMessage.id,
        role: updateMessage.role as "user" | "assistant" | "system",
        parts: [{ type: "text", text: updateMessage.content }]
      },
      { body: { model: chat.model, book: chat, chapterId: chapter?.id } }
    )
  };

  const { book, setActiveBook } = useBookStore()

  React.useEffect(() => {
    setActiveBook(chat)
  }, [chat, chat.id, setActiveBook])

  // Restore the current chapter from the Book on mount so a mid-edit refresh
  // doesn't drop the author into a broken empty state (the chapter store
  // starts null, which would make appendMessage/save pass an undefined id).
  React.useEffect(() => {
    if (!chapter && book.currentChapterId) {
      const current = book.chapters.find((c) => c.id === book.currentChapterId);
      if (current) setChapter(current);
    }
  }, [book, book.currentChapterId, chapter, setChapter])

  // Celebration modal: trap focus inside, close on Escape, and return focus to
  // the trigger when dismissed — so the author is never trapped in an overlay.
  React.useEffect(() => {
    if (!celebrate) return;
    const dialog = celebrateDialogRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const focusables = () =>
      dialog
        ? Array.from(
            dialog.querySelectorAll<HTMLElement>(
              'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            )
          ).filter((el) => !el.hasAttribute("disabled"))
        : [];
    focusables()[0]?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setCelebrate(false);
        return;
      }
      if (e.key === "Tab") {
        const items = focusables();
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [celebrate])

  if (!book) {
    return
  }

  return (
    <div className="flex flex-col h-screen">
      <BookHeader className="px-4">
        <div className="flex items-center flex-1 gap-2">
            <Button size="icon" variant="ghost" aria-label={t("back")} onClick={() => router.back()}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          {chat.title}
        </div>
        <div className="flex items-center">
          <SettingsModal book={chat} />
          {!!activeMessage && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setActiveMessage(undefined)}>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </BookHeader>
      <div className="flex flex-1 bg-background text-foreground overflow-hidden">
        <Outline book={chat} handleSubmit={appendMessage} setMessages={setMessages} isStreaming={status === "streaming"} />
        <main className="flex flex-1 flex-col">
          <div className="flex flex-1 overflow-auto">
            <div className="flex flex-col flex-1  w-full shrink-0 overflow-hidden lg:w-2/5">
              <div className={cn("flex flex-col flex-1 overflow-auto w-full", !activeMessage && "max-w-4xl mx-auto")}>
                <ChatLog
                  messages={messages}
                  toolConfig={{
                    onRefresh: (message) => {
                      refresh(message)
                    },
                    onEdit(message) {
                      if (message.role === "user") {
                        setEditMessage(message)
                        // } else {
                        //   if (activeMessage?.id !== message.id) {
                        //     setActiveMessage(message)
                        //   } else {
                        //     setActiveMessage()
                        //   }
                        //   console.log(message);
                        // 
                      }
                    },
                    // onFix: (newMessageText) => {
                    //   startTransition(async () => {
                    //     appendMessage(chapter?.id!, { content: newMessageText, role: 'user' });
                    //   });
                    // },
                    markdownEditable: true,
                    action: (message => {
                      if (message.role === "user") {
                        return false
                      }
                      return (
                        <div className="flex flex-1 justify-end">
                          {status === "streaming" ? <Loader className="animate-spin w-4 h-4" /> : (
                            <Button variant="ghost" size="icon" onClick={() => onSave(message)}>
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      )
                    })
                  }}

                />
                <ChatBox
                onInputMessage={(message: UIMessage | MessageClient) => {
                  if (message.id) {
                    refresh(message as MessageClient, true)
                  } else {
                    appendMessage(chapter?.id!, message as UIMessage)
                  }
                }}
                  isStreaming={status === "streaming"}
                  onStop={stop}
                />
              </div>
            </div>
            {!!activeMessage && (
              <ChapterContent
                chat={{ ...chat, messages:(messages as unknown as MessageClient[])  }}
                onMessageChange={setActiveMessage}
                isShowing={!!activeMessage}
                message={activeMessage as MessageClient}
              />
            )}
          </div>
        </main>
      </div>

      {celebrate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in-0"
          onClick={() => setCelebrate(false)}
        >
          <div
            ref={celebrateDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="book-complete-title"
            className="relative mx-4 max-w-md w-full rounded-2xl border border-brand/30 bg-background p-8 text-center shadow-xl animate-in fade-in-0 zoom-in-95 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label={t("close")}
              onClick={() => setCelebrate(false)}
              className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
            >
              <X className="size-4" />
            </button>
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-brand/10 text-brand">
              <Sparkles className="size-8" />
            </div>
            <h2 id="book-complete-title" className="text-2xl font-bold">{t("bookCompleteTitle")}</h2>
            <p className="text-muted-foreground">{t("bookCompleteDesc")}</p>
            <Button className="w-full" onClick={() => router.replace(`/books/${chat.id}`)}>
              <BookOpen className="mr-2 size-4" />
              {t("readBook")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}