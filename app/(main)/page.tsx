"use client";

import Header from "@/components/Header";
import BookOutlineForm from "./components/BookOutlineForm"
import { useTranslation } from "react-i18next";

export default function Home() {

  const { t } = useTranslation()

  return (
    <div className="h-screen bg-gradient-to-r from-purple-500 to-indigo-600">
      <Header />
      <main className="flex flex-col items-center justify-center w-full flex-1 text-center">
        <h1 className="text-6xl font-bold">
          {t("welcome")} BookCraft
        </h1>
        <p className="mt-3 text-2xl"> {t("appDesc")}</p>
        <BookOutlineForm />
      </main>
    </div>
  )
}