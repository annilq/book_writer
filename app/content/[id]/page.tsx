import { notFound } from "next/navigation";
import PageClient from "./page.client";
import { getBookById } from "@/app/api/book/actions";
import { getMessageOfChapter } from "@/app/api/chapter/actions";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = (await params).id;
  const book = await getBookById(id);

  if (!book) notFound();

  let messages = await getMessageOfChapter(book.currentChapterId!);
  // Autonomous runs persist content on the chapter, not as messages.
  const currentChapter = book.chapters?.find((c) => c.id === book.currentChapterId);
  if (messages.length === 0 && currentChapter?.content) {
    messages = [{
      id: `chapter-${currentChapter.id}`,
      role: "assistant",
      content: currentChapter.content,
      parts: [{ type: "text", text: currentChapter.content }],
    } as any];
  }

  return <PageClient chat={book} messages={messages as any} />;
}

export type Chat = NonNullable<Awaited<ReturnType<typeof getBookById>>>;
export type Message = Chat["messages"][number];

// export const runtime = "edge";
export const maxDuration = 45;
