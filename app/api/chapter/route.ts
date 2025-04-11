import { NextRequest } from "next/server";
import { fetchChapterContent } from "./actions";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { model, messages, book, chapterId } = body;
  const result = await fetchChapterContent(chapterId, model, book, messages);
  return result.toDataStreamResponse({
    sendReasoning: true
  })
}
