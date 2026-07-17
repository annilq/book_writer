import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { getPrisma } from "@/utils/prisma";
import { appResponse } from "@/utils/response";
import { runAutonomousBook } from "@/utils/agent/runner";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: bookId } = await params;
  return appResponse(async () => {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    const prisma = getPrisma();
    // Clear any previous run (including a stuck RUNNING one) and its chapters,
    // then re-run from scratch. This keeps the endpoint idempotent so the
    // UI "retry" button always works instead of getting blocked forever.
    const existing = await prisma.agentRun.findUnique({ where: { bookId } });
    if (existing) {
      await prisma.chapter.deleteMany({ where: { bookId } });
      await prisma.agentRun.delete({ where: { bookId } });
      // Reset book state so the re-run starts clean (createBookOutline will
      // re-set step/currentChapterId); avoids stale ids from the failed run.
      await prisma.book.update({
        where: { id: bookId },
        data: { step: "INIT", currentChapterId: null },
      });
    }

    const run = await prisma.agentRun.create({
      data: { bookId, status: "RUNNING" },
    });

    // Fire-and-forget background execution (single process).
    // NOTE: production should move this to a queue/worker.
    runAutonomousBook(bookId).catch((e) => console.error("agent run failed", e));

    return { runId: run.id };
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: bookId } = await params;
  return appResponse(async () => {
    const prisma = getPrisma();
    const run = await prisma.agentRun.findUnique({ where: { bookId } });
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    const chapters = await prisma.chapter.findMany({ where: { bookId } });
    const chaptersDone = chapters.filter((c) => c.content && c.content.length > 0).length;
    return {
      run,
      bookStep: book?.step,
      chaptersTotal: chapters.length,
      chaptersDone,
    };
  });
}
