import { NextRequest } from "next/server";
import { fetchBookOutline } from "./actions";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { model, messages, book } = body;
  const result = await fetchBookOutline(book, messages);
  return result.toDataStreamResponse()
}
