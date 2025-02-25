import { NextRequest } from "next/server";
import { appResponse } from "@/utils/response";
import { getPrisma } from "@/utils/prisma";

export async function GET(req: NextRequest) {
  return appResponse(async () => {
    const prisma = getPrisma();
    return await prisma.book.findMany({});
  });
}
