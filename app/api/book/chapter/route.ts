import { NextRequest } from "next/server";
import { appResponse } from "@/utils/response";
import { getPrisma } from "@/utils/prisma";

export async function GET(req: NextRequest) {
  const body = await req.json()
  return appResponse(async () => {
    const prisma = getPrisma();
    const chapters = await prisma.chapter.findMany({
      where: {
        bookId: body.bookId
      }
    });
    return chapters
  });
}
