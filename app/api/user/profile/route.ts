import { auth } from "@/auth";
import { prisma } from "@/utils/prisma";
import { NextResponse } from "next/server";

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await request.json();
  const { name } = body;

  try {
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { name },
    });
    return NextResponse.json(updatedUser);
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
