"use client";

import { useRouter } from "next/navigation"
import { Category } from '@prisma/client';
import BookOutlineForm, { FormSchema } from "@/components/BookOutlineForm"
import { useTranslation } from "react-i18next";
import { Model } from "./api/model/route";
import { useChat } from "ai/react";
import { startTransition } from "react";
import { createChat } from "./api/chat/actions";
import { z } from "zod";

export default function Home(props: { categories: Category[], models: Model[] }) {
  const { models, categories } = props
  const router = useRouter()
  const { t } = useTranslation()
  const { id, setMessages } = useChat();

  const handleSubmit = async (data: z.infer<typeof FormSchema>) => {
    // This would call an API route to generate the outline using the AI SDK
    // For now, we'll just set a dummy outline
    startTransition(async () => {
      const { model, categories, description, title } = data;

      const { messages } = await createChat(
        {
          id,
          title,
          model,
          description,
          categories: [categories]
        }
      );

      setMessages(messages);

      startTransition(() => {
        router.push(`/books/${id}`);
      });
    });
  }

  return (
    <div className="absolute inset-0 overflow-auto flex flex-col items-center">
      <main className="flex flex-col items-center justify-center w-full flex-1 text-center">
        <h1 className="text-6xl font-bold">
          {t("welcome")} BookCraft
        </h1>
        <p className="mt-3 text-2xl"> {t("appDesc")}</p>
        <BookOutlineForm categories={categories} models={models} handleSubmit={handleSubmit} />
      </main>
    </div>
  )
}