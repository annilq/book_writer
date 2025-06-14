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
import { toast } from "@/hooks/use-toast"
import { zodResolver } from "@hookform/resolvers/zod"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import useSWR from "swr";
import { Model } from "@/app/api/model/models";
import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { createBook } from "@/app/api/chat/actions";
import { Spinner } from "@/components/spinner";

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
        <CardDescription className="font-bold text-center mb-8">{t("appTip")}</CardDescription>
      </CardHeader>
      <BookOutlineForm />
    </Card>
  )
}


export function BookOutlineForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const { id, setMessages, reload } = useChat({
    api: "/api/chat",
  });

  const { t, i18n } = useTranslation()
  const { data: categories = [] } = useSWR<Category[]>('/api/categories')
  const { data: models = [] } = useSWR<Model[]>('/api/model')

  const handleSubmit = async (data: z.infer<typeof FormSchema>) => {
    // This would call an API route to generate the outline using the AI SDK
    // For now, we'll just set a dummy outline
    setLoading(true)
    const { model, categories, description, title } = data;

    const chat = await createBook(
      {
        id,
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
        content: msg.content
      })))
      reload({
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
    toast({
      title: "Generating book info ,this will speend some time , please wait a moment",
    })
    await handleSubmit(data)
  }

  return (
    <div className="w-full">
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
            <Button type="submit" className="w-full">
              {t("generateButton")}
            </Button>
          </div>
        </form>
      </Form>
      <Example handleSubmit={(data) => { form.reset(data) }} />
      {loading && <Spinner />}
    </div>
  )
}

