"use client";

import { useRouter } from "next/navigation"
import BookOutlineForm, { FormSchema } from "@/components/BookOutlineForm"
import { useTranslation } from "react-i18next";
import { useChat } from "ai/react";
import { startTransition } from "react";
import { createBook } from "./api/chat/actions";
import { z } from "zod";

export default function Home() {
  const router = useRouter()
  const { t } = useTranslation()
  const { id } = useChat({
    api: "/api/chat"
  });

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
      if (chat) {
        startTransition(() => {
          router.push(`/books/${chat?.id}`);
        });
      }
    });
  }

  return (
    <div className="absolute inset-0 overflow-auto flex flex-col items-center">
      <main className="flex flex-col items-center justify-center w-full flex-1 text-center">
        <h1 className="text-6xl font-bold">
          {t("welcome")} BookCraft
        </h1>
        <p className="mt-3 text-2xl"> {t("appDesc")}</p>
        <BookOutlineForm handleSubmit={handleSubmit} />
      </main>
    </div>
  )
}