import { NextRequest } from "next/server";
import { fetchChapterContent } from "./actions";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { messages, book } = body;
  const result = await fetchChapterContent(book, messages);
  return result.toDataStreamResponse()
}
