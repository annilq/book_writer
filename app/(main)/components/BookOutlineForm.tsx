"use client"

import type React from "react"
import { Category } from '@prisma/client';

import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SUGGESTED_PROMPTS } from "@/utils/constants"
import { useTranslation } from "react-i18next"

import { FormField, FormItem, FormLabel, FormControl, FormMessage, Form } from "@/components/ui/form"
import { toast } from "@/hooks/use-toast"
import { zodResolver } from "@hookform/resolvers/zod"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import useSWR from "swr";
import { Model } from "@/app/api/model/models";
import { startTransition, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { createBook } from "@/app/api/chat/actions";
import { cn } from "@/utils/cn";
import { MessageSquare, Sparkles, CheckCircle2, Loader2, ChevronDown } from "lucide-react";

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

export type BookOutlineFormValues = z.infer<typeof FormSchema>

/**
 * Merge a pre-filled example into the form without wiping the author's work:
 * any field the author has already typed into wins, empty fields get filled.
 */
export function mergeExamplePreservingInput(
  current: BookOutlineFormValues,
  example: Partial<BookOutlineFormValues>,
): BookOutlineFormValues {
  const merged = { ...current }
  for (const key of Object.keys(example) as (keyof BookOutlineFormValues)[]) {
    const authored = current[key]
    // The author's own text always wins over the example.
    if (typeof authored === "string" && authored.trim() !== "") continue
    const value = example[key]
    if (value !== undefined) merged[key] = value
  }
  return merged
}

function Example(props: { handleSubmit: (data: Partial<BookOutlineFormValues>) => void }) {

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
  const [advanced, setAdvanced] = useState(false)
  const { setMessages, regenerate } = useChat({
    api: "/api/chat",
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
          toast({ title: msg });
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
        setMessages((chat.messages || []).map(msg => ({
          id: msg.id,
          role: msg.role as "data" | "system" | "user" | "assistant",
          parts: [{ type: "text", text: msg.content }]
        })))
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

  // Pre-select a recommended model so the author is never forced to pick one.
  // Declared after `form` — referencing it above would be a TDZ error.
  useEffect(() => {
    if (models.length && !form.getValues("model")) {
      form.setValue("model", `${models[0].provider}/${models[0].name}`, { shouldValidate: false });
    }
  }, [models, form])

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    toast({
      title: autonomous ? "Generating book autonomously, please wait..." : "Generating book info ,this will spend some time , please wait a moment",
    })
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
              !autonomous ? "border-brand bg-brand/15 ring-2 ring-brand font-semibold" : "border-border hover:border-foreground/20"
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
              autonomous ? "border-brand bg-brand/15 ring-2 ring-brand font-semibold" : "border-border hover:border-foreground/20"
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
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("labelTitle")}</FormLabel>
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
                <FormLabel>{t("labelCategory")}</FormLabel>
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
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("labelDescription")}</FormLabel>
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

          {/* Advanced options: the model is optional and pre-selected, so it is
              tucked behind a disclosure instead of forced on first-time authors. */}
          <div>
            <button
              type="button"
              onClick={() => setAdvanced(!advanced)}
              className="flex items-center gap-1 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
            >
              {t(advanced ? "advancedOptionsHide" : "advancedOptions")}
              <ChevronDown className={cn("h-4 w-4 transition-transform", advanced && "rotate-180")} />
            </button>
            {advanced && (
              <div className="mt-3">
                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("labelModel")}
                        <span className="ml-1 text-xs font-normal text-muted-foreground">({t("modelOptional")})</span>
                      </FormLabel>
                      <FormControl>
                        <Select {...field} onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("bookModel")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {models.map((model, i) => (
                              <SelectItem key={model.name} value={`${model.provider}/${model.name}`}>
                                {model.name} · {model.provider}
                                {i === 0 && (
                                  <span className="ml-2 text-xs text-brand">({t("modelRecommended")})</span>
                                )}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {autonomous ? t("generateAuto") : t("generateChat")}
          </Button>
        </form>
      </Form>
      <Example
        handleSubmit={(data) => {
          form.reset(mergeExamplePreservingInput(form.getValues(), data))
          setFilledDemo(true)
        }}
      />
      {filledDemo && (
        <p className="mx-6 mb-4 flex items-center justify-center gap-1 text-xs text-brand">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {t("demoFilled")}
        </p>
      )}
    </div>
  )
}

