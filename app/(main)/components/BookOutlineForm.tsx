"use client"

import type React from "react"
import { Book, Category } from '@prisma/client';

import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SUGGESTED_PROMPTS } from "@/utils/constants"
import { useTranslation } from "react-i18next"

import { FormField, FormItem, FormControl, FormMessage, Form } from "@/components/ui/form"
import { toast } from "sonner"
import { zodResolver } from "@hookform/resolvers/zod"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import useSWR from "swr";
import { Model } from "@/app/api/model/models";
import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { UIMessage, useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { createBook } from "@/app/api/chat/actions";
import { cn } from "@/utils/cn";
import { MessageSquare, Sparkles, CheckCircle2, Loader2 } from "lucide-react";

export const FormSchema = z.object({
  title: z.string().min(2, {
    message: "bookName must be at least 2 characters.",
  }),
  language: z.string().optional(),
  description: z.string().min(20, {
    message: "description must be at least 20 characters.",
  }),
  categories: z.string().min(1),
  audience: z.string().optional(),
  prompt: z.string().optional(),
  style: z.string().optional(),
  model: z.string().min(1),
})

function Example(props: { handleSubmit: (data: Partial<Book>) => void }) {

  return (
    <div className="px-6 pb-6 flex w-full flex-wrap justify-center gap-3">
      {SUGGESTED_PROMPTS.map((v) => (
        <Button
          key={v.title}
          variant="secondary"
          onClick={() => props.handleSubmit(v)}
        >
          {v.title}
        </Button>
      ))}
    </div>
  )
}

export function BookOutlineCard() {

  const { t } = useTranslation()

  return (
    <Card className="mx-auto xs:w-full lg:w-[560px] min-w-fit mt-8 relative" >
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-center">{t("appName")}</CardTitle>
        <CardDescription className="font-bold text-center">{t("appTip")}</CardDescription>
      </CardHeader>
      <BookOutlineForm />
    </Card>
  )
}


export function BookOutlineForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [autonomous, setAutonomous] = useState(false)
  const [filledDemo, setFilledDemo] = useState(false)
  const { setMessages, regenerate } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const { t, i18n } = useTranslation()
  const { data: categories = [] } = useSWR<Category[]>('/api/categories')
  const { data: models = [] } = useSWR<Model[]>('/api/model')

  const handleSubmit = async (
    data: z.infer<typeof FormSchema>,
    autonomousFlag = false
  ) => {
    setLoading(true)
    const { model, categories, description, title } = data;

    try {
      if (autonomousFlag) {
        const book = await createBook({
          title,
          model,
          description,
          language: i18n.language,
          categories,
        });
        if (!book) {
          setLoading(false);
          return;
        }
        try {
          const res = await fetch(`/api/book/${book.id}/agent`, { method: "POST" });
          const json = await res.json().catch(() => null);
          if (!res.ok || (json && json.code !== 0)) {
            throw new Error(json?.info || `启动失败 (${res.status})`);
          }
        } catch (e) {
          setLoading(false);
          const msg = e instanceof Error ? e.message : "自主生成启动失败";
          toast.error(msg);
          return;
        }
        setLoading(false);
        startTransition(() => {
          router.push(`/books/${book.id}/agent`);
        });
        return;
      }

      const chat = await createBook(
        {
          title,
          model,
          description,
          categories,
          language: i18n.language
        }
      );
      setLoading(false)

      if (chat) {
        setMessages(
          (chat.messages || []).map(msg => ({
            id: msg.id,
            role: msg.role as "system" | "user" | "assistant",
            parts: [{ type: "text", text: msg.content }],
          })) as UIMessage[]
        )
        regenerate({
          body: {
            chat,
            model: chat.model,
            chatId: chat.id,
            book: chat,
          }
        })
        startTransition(() => {
          router.push(`/chats/${chat?.id}`);
        });
      }
    } catch (e) {
      setLoading(false);
      console.error(e);
    }
  }

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      title: "",
      description: "",
      model: "",
      categories: ""
    },
  })


  async function onSubmit(data: z.infer<typeof FormSchema>) {
    toast(
      autonomous
        ? "Generating book autonomously, please wait..."
        : "Generating book info, this will spend some time, please wait a moment"
    )
    await handleSubmit(data, autonomous)
  }

  return (
    <div className="w-full">
      <div className="px-6 pb-2">
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setAutonomous(false)}
            className={cn(
              "rounded-lg border p-3 text-left transition-all",
              !autonomous ? "border-brand bg-brand/5" : "border-border hover:border-foreground/20"
            )}
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              <MessageSquare className="h-4 w-4 text-brand" />
              {t("modeChat")}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{t("modeChatDesc")}</p>
          </button>
          <button
            type="button"
            onClick={() => setAutonomous(true)}
            className={cn(
              "rounded-lg border p-3 text-left transition-all",
              autonomous ? "border-brand bg-brand/5" : "border-border hover:border-foreground/20"
            )}
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="h-4 w-4 text-brand" />
              {t("modeAuto")}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{t("modeAutoDesc")}</p>
          </button>
        </div>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-2xl mx-auto space-y-4 px-6 pb-6">
          <div className="flex items-center w-full justify-between gap-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input placeholder={t("bookName")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="categories"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Select {...field} onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("bookCate")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories?.map(cate => <SelectItem key={cate.id} value={cate.name}>{t(cate.name)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    placeholder={t("bookDesc")}
                    rows={8}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex items-center gap-4">
            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Select  {...field} onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("bookModel")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {models.map(model => <SelectItem key={model.name} value={`${model.provider}/${model.name}`}>{model.name}/{model.provider}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {autonomous ? t("generateAuto") : t("generateChat")}
            </Button>
          </div>
        </form>
      </Form>
      <Example handleSubmit={(data) => { form.reset(data); setFilledDemo(true); }} />
      {filledDemo && (
        <p className="mx-6 mb-4 flex items-center justify-center gap-1 text-xs text-brand">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {t("demoFilled")}
        </p>
      )}
    </div>
  )
}

