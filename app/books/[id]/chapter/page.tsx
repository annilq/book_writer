import { notFound } from "next/navigation";
import { cache } from "react";
import PageClient from "./page.client";
import { getPrisma } from "@/utils/prisma";

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

const getBookById = cache(async (id: string) => {
  const prisma = getPrisma();
  return await prisma.book.findFirst({
    where: { id },
    include: { chapters: {}, messages: { orderBy: { position: "asc" } } },
  });
});

export type Chat = NonNullable<Awaited<ReturnType<typeof getBookById>>>;
export type Message = Chat["messages"][number];

// export const runtime = "edge";
export const maxDuration = 45;
