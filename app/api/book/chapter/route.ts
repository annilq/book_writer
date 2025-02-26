import { NextRequest } from "next/server";
import { appResponse } from "@/utils/response";
import { getPrisma } from "@/utils/prisma";

export async function GET(req: NextRequest) {
  return appResponse(async () => {
    const { searchParams } = new URL(req.url);
    const bookId = searchParams.get("bookId");

    if (!bookId) {
      throw new Error("bookId is required");
    }
    const prisma = getPrisma();
    const chapters = await prisma.chapter.findMany({
      where: {
        bookId
      }
    });
    return chapters
  });
}
