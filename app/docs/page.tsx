"use client"

import type React from "react"
import { BookOpen, ListTree, PenLine, Sparkles } from "lucide-react"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface Step {
  icon: React.ReactNode
  title: string
  description: string
}

const steps: Step[] = [
  {
    icon: <PenLine className="h-5 w-5" />,
    title: "1. Describe your book",
    description:
      "Provide a title, category and a short description. Pick a model and let BookCraft draft a structured outline for you.",
  },
  {
    icon: <ListTree className="h-5 w-5" />,
    title: "2. Refine the outline",
    description:
      "Review the generated chapters, edit or reorder them, and chat with the AI to shape the structure until it fits your vision.",
  },
  {
    icon: <Sparkles className="h-5 w-5" />,
    title: "3. Generate chapters",
    description:
      "Write each chapter with AI assistance, iterate on the content, and save the versions you are happy with.",
  },
  {
    icon: <BookOpen className="h-5 w-5" />,
    title: "4. Read & publish",
    description:
      "Once every chapter is complete, read the finished book in a clean reading view and share your masterpiece.",
  },
]

const faqs = [
  {
    question: "What is BookCraft?",
    answer:
      "BookCraft is an AI-assisted writing tool that helps you go from an idea to a fully structured book — outline, chapters and final draft — with the help of large language models.",
  },
  {
    question: "Which AI models can I use?",
    answer:
      "You can choose from the models configured for your account when creating a book. Different providers may be available depending on your setup.",
  },
  {
    question: "Can I edit the AI-generated content?",
    answer:
      "Yes. Every outline and chapter is fully editable. You can rewrite, regenerate or manually adjust any part of your book at any time.",
  },
  {
    question: "How do subscriptions work?",
    answer:
      "Free accounts can try the core features. Pro plans unlock additional capacity and features — visit the Subscription page to compare plans or redeem a code.",
  },
]

export default function DocsPage() {
  return (
    <div className="flex flex-col h-screen bg-background overflow-y-auto">
      <Header className="bg-background border-b" />

      <main className="flex-1">
        <div className="container mx-auto max-w-4xl px-4 py-12 space-y-12">
          <div className="text-center space-y-3">
            <h1 className="tracking-tight">Documentation</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Learn how to create your next book with BookCraft — from the first
              idea to a finished, publishable draft.
            </p>
          </div>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold tracking-tight">
              How it works
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {steps.map((step) => (
                <Card key={step.title}>
                  <CardHeader>
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand/10 text-brand mb-2">
                      {step.icon}
                    </div>
                    <CardTitle className="text-lg">{step.title}</CardTitle>
                    <CardDescription>{step.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold tracking-tight">
              Frequently asked questions
            </h2>
            <Card>
              <CardContent className="pt-6">
                <Accordion type="single" collapsible className="w-full">
                  {faqs.map((faq, i) => (
                    <AccordionItem key={i} value={`item-${i}`}>
                      <AccordionTrigger className="text-left">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
