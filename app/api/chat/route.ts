import { NextRequest } from "next/server";
import { LangChainAdapter, Message } from "ai";
import { fetchBookOutline } from "./actions";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { model, messages, book } = body;
  const eventStream = await fetchBookOutline(book, messages);

  return LangChainAdapter.toDataStreamResponse(eventStream);
}
