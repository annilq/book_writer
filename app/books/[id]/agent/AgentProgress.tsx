"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, BookOpen, Sparkles, WifiOff } from "lucide-react";

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

// Cap reconnection attempts so a permanently dead backend stops looping
// instead of freezing the view forever.
const MAX_RECONNECT_ATTEMPTS = 8;

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
  const [reconnecting, setReconnecting] = useState(false);
  const [reconnectFailed, setReconnectFailed] = useState(false);
  const reconnectAttempts = useRef(0);
  const reconnectingRef = useRef(false);

  const load = useCallback(async (): Promise<RunStatus | "RECONNECTING" | "RECONNECT_FAILED" | null> => {
    try {
      const res = await fetch(`/api/book/${bookId}/agent`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      reconnectAttempts.current = 0;
      reconnectingRef.current = false;
      setReconnecting(false);
      if (json.code === 0) {
        setProgress(json.data as Progress);
        return (json.data as Progress)?.run?.status ?? null;
      }
      return null;
    } catch {
      reconnectAttempts.current += 1;
      if (reconnectAttempts.current <= MAX_RECONNECT_ATTEMPTS) {
        reconnectingRef.current = true;
        setReconnecting(true);
        return "RECONNECTING";
      }
      reconnectingRef.current = false;
      setReconnecting(false);
      setReconnectFailed(true);
      return "RECONNECT_FAILED";
    }
  }, [bookId]);

  useEffect(() => {
    let active = true;
    const tick = async () => {
      const status = await load();
      if (!active) return;
      // Keep polling while the run is active or while recovering a dropped
      // connection. Stop only on terminal states or a permanently lost run.
      if (status && status !== "DONE" && status !== "FAILED" && status !== "RECONNECT_FAILED") {
        setTimeout(tick, reconnectingRef.current ? 5000 : 2000);
      }
    };
    tick();
    return () => {
      active = false;
    };
  }, [load]);

  const retry = async () => {
    reconnectAttempts.current = 0;
    reconnectingRef.current = false;
    setReconnecting(false);
    setReconnectFailed(false);
    await fetch(`/api/book/${bookId}/agent`, { method: "POST" });
    load();
  };

  if (reconnectFailed) {
    return (
      <div className="mx-auto max-w-2xl p-8 flex flex-col items-center justify-center gap-3 text-center">
        <XCircle className="w-6 h-6 text-destructive shrink-0" />
        <p className="font-medium text-destructive">{t("agentReconnectFailed")}</p>
        <Button variant="outline" onClick={retry}>
          {t("retry")}
        </Button>
      </div>
    );
  }

  if (progress === null) {
    return (
      <div
        className="mx-auto max-w-2xl p-8 flex items-center gap-2 text-muted-foreground"
        aria-live="polite"
      >
        <Loader2 className="w-5 h-5 animate-spin" />
        {reconnecting ? t("agentReconnecting") : t("loading")}
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

      {/* Status region — announced to assistive tech as it changes */}
      <div aria-live="polite" className="space-y-4">
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
                        ? "bg-success text-success-foreground border-success"
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
                      isFinished ? "bg-success" : "bg-border"
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
          <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive">
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
          <div className="flex items-center gap-3 rounded-xl border border-success/40 bg-success/10 p-4 text-success animate-in fade-in-0 zoom-in-95">
            <CheckCircle2 className="w-6 h-6 shrink-0" />
            <div className="flex-1 font-medium">{t("agentStatusDone")}</div>
            <Button onClick={() => router.push(`/books/${bookId}`)}>
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
              <p className="mt-1 text-xs text-muted-foreground">
                {t("agentReassure")}
              </p>
            </div>
          </div>
        )}

        {reconnecting && status !== "DONE" && status !== "FAILED" && (
          <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-warning text-sm">
            <WifiOff className="w-4 h-4 shrink-0" />
            {t("agentReconnecting")}
          </div>
        )}

        {!progress?.run && (
          <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive">
            <XCircle className="w-5 h-5 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="font-medium">{t("agentNotStarted")}</p>
            </div>
            <Button variant="outline" onClick={retry}>
              {t("retry")}
            </Button>
          </div>
        )}
      </div>

      {/* Activity log timeline */}
      <div className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">
          {t("agentLogTitle")}
        </h2>
        <div
          className="border rounded-xl p-4 h-64 overflow-auto text-sm space-y-3 bg-muted/30"
          aria-live="polite"
        >
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
