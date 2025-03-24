import { notFound } from "next/navigation";
import PageClient from "./page.client";
import { getBookById } from "@/app/api/book/actions";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = (await params).id;
  const book = await getBookById(id);

  if (!book) notFound();

  return <PageClient chat={book} />;
}

export type Chat = NonNullable<Awaited<ReturnType<typeof getBookById>>>;
export type Message = Chat["messages"][number];

// export const runtime = "edge";
export const maxDuration = 45;
