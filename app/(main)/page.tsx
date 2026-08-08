"use client";

import Header from "@/components/Header";
import { BookOutlineCard } from "./components/BookOutlineForm"
import { useTranslation } from "react-i18next";
import { Sparkles } from "lucide-react";
import Footer from "@/components/Footer";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function Home() {

  const { t } = useTranslation()
  const session = useSession()

  return (
    <div className="flex grow flex-col">
      <div className="flex min-h-screen flex-col bg-brand">
        <Header className="border-transparent bg-transparent supports-[backdrop-filter]:bg-transparent text-brand-foreground" />
        <main className="flex flex-1 flex-col items-center justify-center w-full text-center px-4 py-16">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-brand-foreground/10 px-3 py-1 text-xs font-medium text-brand-foreground/80 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            AI Book Studio
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-brand-foreground sm:text-6xl">
            {t("welcome")} BookCraft
          </h1>
          <p className="mt-6 text-lg text-brand-foreground/80 max-w-2xl mx-auto">
            {t("appDesc")}
          </p>
          {session.data?.user && (
            <Link
              href="/books"
              className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-brand-foreground/30 bg-brand-foreground/10 px-4 py-2 text-sm font-medium text-brand-foreground backdrop-blur transition-colors hover:bg-brand-foreground/20"
            >
              {t("bookshelf")} →
            </Link>
          )}
          <BookOutlineCard />
        </main>
      </div>
      <Footer />
    </div>
  )
}
