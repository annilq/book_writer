"use client"

import * as React from "react"
import { useTranslation } from "react-i18next"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type ConfirmDialogProps = {
  title: React.ReactNode
  /** Say plainly what will be lost — this is the author's last chance to back out. */
  description: React.ReactNode
  /** Defaults to the generic "confirm" label. */
  actionLabel?: React.ReactNode
  cancelLabel?: React.ReactNode
  onConfirm: () => void | Promise<void>
  /**
   * Uncontrolled usage: the element that opens the dialog. Rendered with
   * `asChild`, so pass a single focusable element.
   */
  trigger?: React.ReactNode
  /**
   * Controlled usage: drive `open` yourself when the intent arrives from
   * something other than a click on a trigger (e.g. a <Select> change).
   */
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

/**
 * The single seam every destructive action goes through, so that losing work
 * always looks and behaves the same way. Prefer this over hand-rolling an
 * AlertDialog at the call site.
 */
export function ConfirmDialog({
  title,
  description,
  actionLabel,
  cancelLabel,
  onConfirm,
  trigger,
  open,
  onOpenChange,
}: ConfirmDialogProps) {
  const { t } = useTranslation()

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger> : null}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel ?? t("cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={() => void onConfirm()}>
            {actionLabel ?? t("confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
