"use client";

import { useEffect, useRef, useState } from "react";
import { UIMessage } from "ai";
import { ArrowRight, Pen, Square, X } from "lucide-react";
import { useTranslation } from "react-i18next"

import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Textarea } from "@/components/ui/textarea";
import { useMessageStore } from "@/store/message";
import { Button } from "@/components/ui/button";
import { Message } from "@prisma/client";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export const FormSchema = z.object({
  // The schema is module-scoped, so it carries an i18n key rather than a
  // literal; the component translates it at render time.
  prompt: z.string().min(2, {
    message: "promptTooShort",
  }),
})

export default function ChatBox({
  onInputMessage,
  isStreaming,
  onStop,
}: {
  onInputMessage: (v: UIMessage | Message) => void;
  isStreaming: boolean;
  onStop?: () => void;
}) {
  const { t } = useTranslation()

  const { editMessage: message, setEditMessage } = useMessageStore()

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const pendingEditRef = useRef<{ id?: string; prompt: string } | null>(null);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      prompt: "",
    },
  })

  const prompt = form.watch("prompt") ?? ""

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    // Editing an existing message destroys every later message in the thread,
    // so ask for confirmation before firing the (destructive) regen.
    if (message) {
      pendingEditRef.current = { id: message.id, prompt: data.prompt };
      setConfirmOpen(true);
      return;
    }
    onInputMessage({ id: message?.id, role: "user", parts: [{ type: "text", text: data.prompt }] });
    setEditMessage()
  }

  useEffect(() => {
    if (isStreaming) {
      return
    }
    form.setValue("prompt", message?.content!)
    textareaRef.current?.focus();
  }, [form, message, isStreaming])

  const canSend = prompt.trim().length > 0 && !isStreaming

  const promptError = form.formState.errors.prompt?.message

  return (
    <div className="mb-4 flex flex-col shrink-0 px-4">
      <div className="relative w-full rounded-2xl overflow-hidden border bg-secondary p-2">
        {message ? (
          <div className="font-bold p-2 text-xs bg-background rounded mb-2 flex justify-between items-center">
            <div className="flex  items-center gap-2"><Pen className="h-4 w-4" />{t("editTip")}</div>
            <Button variant="link" size="sm" onClick={() => setEditMessage()}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : false}
        <div className="flex min-h-[84px]">
          <Form {...form} >
            <form onSubmit={form.handleSubmit(onSubmit)} className="relative flex w-full">
              <FormField
                control={form.control}
                name="prompt"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder={t("followUp")}
                        ref={textareaRef}
                        disabled={isStreaming}
                        aria-label={t("followUp")}
                        className="absolute shadow-none border-none inset-0 w-full resize-none placeholder:text-muted-foreground disabled:opacity-50 focus-visible:ring-1 focus-visible:ring-ring p-0"
                        onKeyDown={(event) => {
                          if (event.key === "Enter" && !event.shiftKey) {
                            event.preventDefault();
                            form.handleSubmit(onSubmit)();
                          }
                        }}
                      />
                    </FormControl>
                    {/* The message is rendered below the box instead of here:
                        the textarea is absolutely positioned over this slot,
                        which would hide the reason the submit failed. */}
                  </FormItem>
                )}
              />
              <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1">
                {isStreaming && (
                  <button
                    type="button"
                    aria-label={t("stop")}
                    onClick={() => onStop?.()}
                    className="relative inline-flex size-9 items-center justify-center rounded-md border border-border bg-background font-medium text-foreground shadow-sm transition-colors hover:bg-accent focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <Square className="size-4 fill-current" />
                  </button>
                )}
                <button
                  type="submit"
                  aria-label={t("send")}
                  disabled={!canSend}
                  className="relative inline-flex size-9 items-center justify-center rounded-md bg-primary font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowRight className="size-4" />
                </button>
              </div>
            </form>
          </Form>
        </div>
      </div>
      {promptError ? (
        <p role="alert" className="mt-1.5 px-1 text-xs font-medium text-destructive">
          {t(promptError)}
        </p>
      ) : null}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t("editDiscardTitle")}
        description={t("editDiscardContent")}
        actionLabel={t("editDiscardAction")}
        onConfirm={() => {
          const p = pendingEditRef.current;
          if (p) {
            onInputMessage({ id: p.id, role: "user", parts: [{ type: "text", text: p.prompt }] });
            setEditMessage();
          }
          setConfirmOpen(false);
        }}
      />
    </div>
  );
}
