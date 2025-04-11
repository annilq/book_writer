"use client";

import { Spinner } from "@/components/spinner";
import { useEffect, useRef } from "react";
import { CreateMessage } from "ai";
import { ArrowRight, Pen, X } from "lucide-react";
import { useTranslation } from "react-i18next"

import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Textarea } from "@/components/ui/textarea";
import { useMessageStore } from "@/store/message";
import { Button } from "@/components/ui/button";
import { Message } from "@prisma/client";

export const FormSchema = z.object({
  prompt: z.string().min(2, {
    message: "must be at least 2 characters.",
  }),
})

export default function ChatBox({
  onInputMessage,
  isStreaming,
}: {
  onInputMessage: (v: CreateMessage | Message) => void;
  isStreaming: boolean;
}) {
  const { t } = useTranslation()

  const { editMessage: message, setEditMessage } = useMessageStore()

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      prompt: "",
    },
  })

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    onInputMessage({ content: data.prompt, role: "user", id: message?.id });
    setEditMessage()
  }

  useEffect(() => {
    if (isStreaming) {
      return
    }
    form.setValue("prompt", message?.content!)
    textareaRef.current?.focus();
  }, [form, message, isStreaming])

  return (
    <div className="mb-4 flex shrink-0 px-4">
      <div className="relative w-full rounded-2xl overflow-hidden border border-gray-300 bg-secondary p-2">
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
                        placeholder="Follow up"
                        ref={textareaRef}
                        disabled={isStreaming}
                        className="absolute shadow-none border-none inset-0 w-full resize-none placeholder-gray-500 disabled:opacity-50 focus-visible:ring-0 p-0"
                        onKeyDown={(event) => {
                          if (event.key === "Enter" && !event.shiftKey) {
                            event.preventDefault();
                            form.handleSubmit(onSubmit)
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="absolute bottom-1.5 right-1.5 flex has-disabled:opacity-50">
                <div className="pointer-events-none absolute inset-0 -bottom-[1px] rounded bg-blue-700" />
                <button
                  className="relative w-full inline-flex size-6 items-center justify-center rounded bg-blue-500 font-medium text-white shadow-lg outline-blue-300 hover:bg-blue-500/75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  type="submit"
                >
                  {isStreaming ? <Spinner /> : <ArrowRight />}
                </button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
