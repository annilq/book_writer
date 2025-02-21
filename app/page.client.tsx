"use client";

import { useRouter } from "next/navigation"
import { Book, Category } from '@prisma/client';
import BookOutlineForm from "@/components/BookOutlineForm"
import { useTranslation } from "react-i18next";
import { Model } from "./api/model/route";

export default function Home(props: { categories: Category[], models: Model[] }) {
  const { models, categories } = props
  const router = useRouter()
  const { t } = useTranslation()

  const handleSubmit = async (data: Partial<Book>) => {
    // This would call an API route to generate the outline using the AI SDK
    // For now, we'll just set a dummy outline
    router.push(
      `/book/${data.id}`,
    )
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