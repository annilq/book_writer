import AgentProgress from "./AgentProgress";
import { getBookById } from "@/app/api/book/actions";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const book = await getBookById(id);
  return <AgentProgress bookId={id} bookTitle={book?.title} />;
}

export const maxDuration = 60;
