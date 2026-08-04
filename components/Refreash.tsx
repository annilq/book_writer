"use client";

import { RefreshCcw } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import useSWR from "swr";
import { Model } from "@/app/api/model/models";
import { useTranslation } from "react-i18next"
import { Button } from "./ui/button";
import { useBookStore } from "@/store/book";
import { useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";

/** Both entry points below throw away every message after this one. */
type PendingRefresh = { model: string; kind: "model" | "retry" }

export function RefreashMessage({ refresh }: { refresh: (model: string) => void }) {
  const { data: models = [] } = useSWR<Model[]>('/api/model')
  const { t } = useTranslation()

  const { book } = useBookStore()
  const [selectOpen, setSelectOpen] = useState(false)
  const [selectedModel, setSelectedModel] = useState(book?.model ?? "")
  const [pending, setPending] = useState<PendingRefresh | null>(null)

  // The book can arrive after mount, so adopt its model when it changes.
  // This never clobbers an author's own pick, because a confirmed change
  // does not write back to book.model.
  useEffect(() => {
    if (book?.model) setSelectedModel(book.model)
  }, [book?.model])

  const confirmPending = () => {
    if (pending) {
      setSelectedModel(pending.model)
      refresh(pending.model)
    }
    setPending(null)
  }

  return (
    <div className="self-end max-w-[80%]">
      <Select
        open={selectOpen}
        onOpenChange={setSelectOpen}
        value={selectedModel}
        // Switching models regenerates from here, so route it through the
        // same confirm seam as edit-resend rather than firing immediately.
        onValueChange={(model) => setPending({ model, kind: "model" })}
      >
        <SelectTrigger aria-label={t("changeModel")} className="shadow-none border-none gap-1 focus:ring-0">
          <RefreshCcw className="h-4 w-4" /> <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {models.map(model => <SelectItem key={model.name} value={`${model.provider}/${model.name}`}>{model.name}/{model.provider}</SelectItem>)}
          <div className="text-center divide-y border-t border-border">
            <Button
              size="sm"
              className="w-full"
              variant={"ghost"}
              // Retry is destructive too — same seam, no bypass.
              onClick={() => {
                setSelectOpen(false)
                setPending({ model: selectedModel, kind: "retry" })
              }}
            >
              {t("retry")}
            </Button>
          </div>
        </SelectContent>
      </Select>
      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => { if (!open) setPending(null) }}
        title={t(pending?.kind === "retry" ? "editDiscardTitle" : "confirmModelChangeTitle")}
        description={t(pending?.kind === "retry" ? "editDiscardContent" : "confirmModelChangeContent")}
        actionLabel={t(pending?.kind === "retry" ? "editDiscardAction" : "confirm")}
        onConfirm={confirmPending}
      />
    </div>
  );
}
