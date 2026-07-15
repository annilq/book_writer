import AgentProgress from "./AgentProgress";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AgentProgress bookId={id} />;
}

export const maxDuration = 60;
