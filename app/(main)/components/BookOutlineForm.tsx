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
import { Spinner } from "@/components/spinner";
import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { createBook } from "@/app/api/chat/actions";

export const FormSchema = z.object({
  title: z.string().min(2, {
    message: "bookName must be at least 2 characters.",
  }),
  description: z.string().min(20, {
    message: "description must be at least 20 characters.",
  }),
  categories: z.string().min(1),
  model: z.string().min(1),
})

function Example(props: { handleSubmit: (data: Partial<Book>) => void }) {

  return (
    <div className="px-6 pb-6 flex w-full flex-wrap justify-center gap-3">
      {SUGGESTED_PROMPTS.map((v) => (
        <button
          key={v.title}
          type="button"
          onClick={() => props.handleSubmit(v)}
          className="rounded bg-secondary px-2.5 py-1.5 text-xs hover:outline hover:outline-1"
        >
          {v.title}
        </button>
      ))}
    </div>
  )
}

export default function BookOutlineForm() {
  const router = useRouter()
  const { id, status, setMessages } = useChat({
    api: "/api/chat"
  });

  const { t } = useTranslation()
  const { data: categories = [] } = useSWR<Category[]>('/api/categories')
  const { data: models = [] } = useSWR<Model[]>('/api/model')

  const handleSubmit = async (data: z.infer<typeof FormSchema>) => {
    // This would call an API route to generate the outline using the AI SDK
    // For now, we'll just set a dummy outline
    startTransition(async () => {
      const { model, categories, description, title } = data;

      const chat = await createBook(
        {
          id,
          title,
          model,
          description,
          categories: [categories]
        }
      );

      setMessages(chat?.messages || [])

      if (chat) {
        startTransition(() => {
          router.push(`/chapter/${chat?.id}`);
        });
      }
    });
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
      title: "You submitted the following values:",
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
    })
    await handleSubmit(data)
  }

  return (
    <Card className="mx-auto w-1/4 min-w-fit max-w-2xl mt-8 relative" >
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-center">{t("appName")}</CardTitle>
        <CardDescription className="font-bold text-center mb-8">{t("appTip")}</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-2xl mx-auto space-y-4 px-6 pb-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input placeholder={t("bookName")} {...field} />
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
                      {categories.map(cate => <SelectItem key={cate.id} value={cate.name}>{t(cate.name)}</SelectItem>)}
                    </SelectContent>
                  </Select>
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
                        {models.map(model => <SelectItem key={model.name} value={`${model.provider}/${model.name}`}>{model.name}</SelectItem>)}
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
      {status === "streaming" && <Spinner />}
    </Card>
  )
}

