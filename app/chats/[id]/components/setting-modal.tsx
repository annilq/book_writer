"use client"

import type React from "react"
import { useState } from "react"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { useTranslation } from "react-i18next"
import { Settings } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { FormField, FormItem, FormControl, FormMessage, Form } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"

import { FormSchema } from "@/app/(main)/components/BookOutlineForm"
import { z } from "zod"
import { Book, Category } from "@prisma/client"
import useSWR from "swr"
import { Model } from "@/app/api/model/models"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Markdown from "react-markdown"

export function SettingsModal({ book }: { book: Book }) {
  const [open, setOpen] = useState(false)

  const { t, i18n } = useTranslation()

  const { data: categories = [] } = useSWR<Category[]>('/api/categories')
  const { data: models = [] } = useSWR<Model[]>('/api/model')

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      title: book.title,
      description: book.description,
      model: book.model,
      prompt: book.prompt,
      categories: book.categories?.[0]?.name
    },
  })

  async function onSubmit(data: z.infer<typeof FormSchema>) {

    console.log(data);
    setOpen(false)
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="icon" variant="ghost">
          <Settings className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-2xl overflow-auto">
        <SheetHeader className="mb-2">
          <SheetTitle>{t("bookSetting")}</SheetTitle>
        </SheetHeader>
        <Tabs defaultValue="info">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info">{t("bookInfo")}</TabsTrigger>
            <TabsTrigger value="prompt">{t("bookPrompt")}</TabsTrigger>
          </TabsList>
          <TabsContent value="info">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pb-6">
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
                              {categories.map(cate => <SelectItem key={cate.id} value={cate.name}>{t(cate.name)}</SelectItem>)}
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
                  <SheetFooter className="flex-1">
                    <SheetClose asChild>
                      <Button type="submit" className="w-full" >
                        {t("save")}
                      </Button>
                    </SheetClose>
                  </SheetFooter>
                </div>
              </form>
            </Form>
          </TabsContent>
          <TabsContent value="prompt">
            <Markdown className={"text-sm"}>{book.prompt}</Markdown>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}


