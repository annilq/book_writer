"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

type RunStatus = "RUNNING" | "DONE" | "FAILED";
type RunLogEntry = { ts: string; step: string; message: string };
type Run = {
  status: RunStatus;
  currentStep: string;
  log: RunLogEntry[] | null;
  error: string | null;
};
type Progress = {
  run: Run | null;
  bookStep: string | null;
  chaptersTotal: number;
  chaptersDone: number;
};

const STEPS = ["PROMPT", "OUTLINE", "CHAPTER", "COMPLETE"];

export default function AgentProgress({ bookId }: { bookId: string }) {
  const router = useRouter();
  const [progress, setProgress] = useState<Progress | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/book/${bookId}/agent`);
    const json = await res.json();
    if (json.code === 0) setProgress(json.data as Progress);
  }, [bookId]);

  useEffect(() => {
    let active = true;
    const tick = async () => {
      await load();
      if (active) setTimeout(tick, 2000);
    };
    tick();
    return () => {
      active = false;
    };
  }, [load]);

  const retry = async () => {
    await fetch(`/api/book/${bookId}/agent`, { method: "POST" });
    load();
  };

  const status = progress?.run?.status;
  const currentStep = progress?.run?.currentStep ?? "";
  const done = progress?.chaptersDone ?? 0;
  const total = progress?.chaptersTotal ?? 0;

  return (
    <div className="mx-auto max-w-2xl p-8 space-y-6">
      <h1 className="text-2xl font-bold">自主生成进度</h1>

      <div className="flex items-center gap-2 flex-wrap">
        {STEPS.map((s) => {
          const active = currentStep.startsWith(s);
          const finished =
            s === "COMPLETE" ? status === "DONE" : STEPS.indexOf(s) < STEPS.indexOf(currentStep.replace(/:\d+\/\d+/, "") as any);
          return (
            <span
              key={s}
              className={`px-3 py-1 rounded-full text-sm border ${
                active ? "bg-primary text-primary-foreground" : finished ? "bg-green-100" : "bg-muted"
              }`}
            >
              {s}
            </span>
          );
        })}
      </div>

      {status === "FAILED" && (
        <div className="flex items-center gap-2 text-red-600">
          <XCircle className="w-5 h-5" />
          <span>{progress?.run?.error ?? "Generation failed"}</span>
          <Button variant="outline" onClick={retry}>重试</Button>
        </div>
      )}

      {status === "DONE" && (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle2 className="w-5 h-5" />
          <span>生成完成！</span>
          <Button onClick={() => router.push(`/content/${bookId}`)}>查看书籍</Button>
        </div>
      )}

      {status === "RUNNING" && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>{currentStep}</span>
        </div>
      )}

      {total > 0 && (
        <div className="text-sm text-muted-foreground">
          章节完成度：{done} / {total}
        </div>
      )}

      <div className="border rounded-md p-4 h-64 overflow-auto text-sm space-y-1 bg-muted/30">
        {(progress?.run?.log ?? []).map((e, i) => (
          <div key={i} className="flex gap-2">
            <span className="text-muted-foreground">{new Date(e.ts).toLocaleTimeString()}</span>
            <span className="font-mono text-xs">{e.step}</span>
            <span>{e.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
