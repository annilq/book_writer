"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, BookOpen, Sparkles } from "lucide-react";

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

const STEP_KEYS = ["PROMPT", "OUTLINE", "CHAPTER", "COMPLETE"] as const;
type StepKey = (typeof STEP_KEYS)[number];
const STEP_LABEL_KEY: Record<StepKey, string> = {
  PROMPT: "agentStepPrompt",
  OUTLINE: "agentStepOutline",
  CHAPTER: "agentStepChapter",
  COMPLETE: "agentStepComplete",
};

function normalizeStep(step: string): StepKey {
  const base = step.replace(/:\d+\/\d+/, "") as StepKey;
  return (STEP_KEYS as readonly string[]).includes(base) ? base : "PROMPT";
}

export default function AgentProgress({
  bookId,
  bookTitle,
}: {
  bookId: string;
  bookTitle?: string;
}) {
  const router = useRouter();
  const { t } = useTranslation();
  const [progress, setProgress] = useState<Progress | null>(null);

  const load = useCallback(async (): Promise<RunStatus | null> => {
    const res = await fetch(`/api/book/${bookId}/agent`);
    const json = await res.json();
    if (json.code === 0) {
      setProgress(json.data as Progress);
      return (json.data as Progress)?.run?.status ?? null;
    }
    return null;
  }, [bookId]);

  useEffect(() => {
    let active = true;
    const tick = async () => {
      const status = await load();
      // Stop polling once the run reaches a terminal state, or if no run
      // was ever started (run === null) so we don't loop forever.
      if (active && status && status !== "DONE" && status !== "FAILED") {
        setTimeout(tick, 2000);
      }
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

  if (progress === null) {
    return (
      <div className="mx-auto max-w-2xl p-8 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
        {t("loading")}
      </div>
    );
  }

  const status = progress?.run?.status;
  const currentStepRaw = progress?.run?.currentStep ?? "";
  const currentStep = normalizeStep(currentStepRaw);
  const done = progress?.chaptersDone ?? 0;
  const total = progress?.chaptersTotal ?? 0;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="mx-auto max-w-2xl p-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          {t("agentTitle")}
        </h1>
        {bookTitle && (
          <p className="text-sm text-muted-foreground truncate">{bookTitle}</p>
        )}
      </div>

      {/* Stepper */}
      <div className="flex items-center">
        {STEP_KEYS.map((s, i) => {
          const isActive = currentStep === s && status === "RUNNING";
          const isFinished =
            s === "COMPLETE"
              ? status === "DONE"
              : STEP_KEYS.indexOf(s) < STEP_KEYS.indexOf(currentStep);
          return (
            <div key={s} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center border text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground border-primary"
                      : isFinished
                      ? "bg-green-500 text-white border-green-500"
                      : "bg-muted text-muted-foreground border-border"
                  }`}
                >
                  {isFinished && s !== "COMPLETE" ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : isActive ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    i + 1
                  )}
                </div>
                <span
                  className={`text-xs whitespace-nowrap ${
                    isActive
                      ? "text-foreground font-medium"
                      : "text-muted-foreground"
                  }`}
                >
                  {t(STEP_LABEL_KEY[s])}
                </span>
              </div>
              {i < STEP_KEYS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 mb-5 ${
                    isFinished ? "bg-green-500" : "bg-border"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Chapter progress */}
      {total > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{t("agentChapterProgress")}</span>
            <span>
              {done} / {total} ({pct}%)
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* Status banners */}
      {status === "FAILED" && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/30 p-4 text-red-700 dark:text-red-300">
          <XCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <div className="flex-1 space-y-1">
            <p className="font-medium">{t("agentStatusFailed")}</p>
            <p className="text-sm break-words">
              {progress?.run?.error ?? t("agentDefaultError")}
            </p>
          </div>
          <Button variant="outline" onClick={retry}>
            {t("retry")}
          </Button>
        </div>
      )}

      {status === "DONE" && (
        <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 dark:bg-green-950/30 p-4 text-green-700 dark:text-green-300">
          <CheckCircle2 className="w-6 h-6 shrink-0" />
          <div className="flex-1 font-medium">{t("agentStatusDone")}</div>
          <Button onClick={() => router.push(`/content/${bookId}`)}>
            <BookOpen className="w-4 h-4 mr-1" />
            {t("agentViewBook")}
          </Button>
        </div>
      )}

      {status === "RUNNING" && (
        <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
          <Loader2 className="w-5 h-5 animate-spin text-primary shrink-0" />
          <div className="flex-1 text-sm">
            <span className="text-muted-foreground">
              {t("agentStatusRunning")}{" "}
            </span>
            <span className="font-medium">{currentStepRaw}</span>
          </div>
        </div>
      )}

      {!progress?.run && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/30 p-4 text-red-700 dark:text-red-300">
          <XCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-medium">{t("agentNotStarted")}</p>
          </div>
          <Button variant="outline" onClick={retry}>
            {t("retry")}
          </Button>
        </div>
      )}

      {/* Activity log timeline */}
      <div className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">
          {t("agentLogTitle")}
        </h2>
        <div className="border rounded-xl p-4 h-64 overflow-auto text-sm space-y-3 bg-muted/30">
          {(progress?.run?.log ?? []).length === 0 ? (
            <p className="text-muted-foreground text-xs">{t("agentLogEmpty")}</p>
          ) : (
            (progress?.run?.log ?? []).map((e, i) => (
              <div key={i} className="flex gap-3 items-start">
                <span className="text-muted-foreground text-xs whitespace-nowrap pt-0.5">
                  {new Date(e.ts).toLocaleTimeString()}
                </span>
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                <div className="flex-1 space-y-0.5">
                  <span className="font-mono text-xs text-primary">{e.step}</span>
                  <p className="text-foreground/90">{e.message}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
