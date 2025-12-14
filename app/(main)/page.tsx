"use client";

import Header from "@/components/Header";
import { BookOutlineCard } from "./components/BookOutlineForm"
import { useTranslation } from "react-i18next";
import Footer from "@/components/Footer";

export default function Home() {

  const { t } = useTranslation()

  return (
    <div className="flex grow flex-col scrollbar-none overflow-y-scroll h-screen">
      <div className="min-h-screen flex flex-col bg-linear-to-r from-purple-500 to-indigo-600">
        <Header className="from-purple-500 to-indigo-600 text-white" />
        <main className="flex flex-col grow items-center justify-center w-full text-center px-4">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
            {t("welcome")} BookCraft
          </h1>
          <p className="mt-6 text-lg text-purple-100 max-w-2xl mx-auto"> 
            {t("appDesc")}
          </p>
          <BookOutlineCard />
        </main>
      </div>
      <Footer />
    </div>
  )
}
