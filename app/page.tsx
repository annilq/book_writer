import { cache } from "react";
import PageClient from "./page.client";
import { getPrisma } from "@/utils/prisma";
import { getModels } from "./api/model/models";

export default async function Page() {
  const [categories, models] =await Promise.all([getCategories(), getModels()])

  return <PageClient categories={categories} models={models} />;
}

const getCategories = cache(async () => {
  const prisma = getPrisma();
  return await prisma.category.findMany({});
});
// cause ollama use fs module but edge doesn't support
// export const runtime = "edge";
export const maxDuration = 45;
