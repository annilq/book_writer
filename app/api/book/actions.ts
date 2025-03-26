"use server";

import { getPrisma } from "@/utils/prisma";
import { cache } from "react";

export const getBookById = cache(async (id: string) => {
  const prisma = getPrisma();
  return await prisma.book.findFirst({
    where: { id },
    include: { chapters: {}, messages: { orderBy: { position: "asc" } }, categories: {} },
  });
});