import { BookOutlineForm } from "@/app/(main)/components/BookOutlineForm"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus } from "lucide-react"
import { useTranslation } from "react-i18next"

export function BookDialog({ collapse }: { collapse: boolean }) {
  const { t } = useTranslation()
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="rounded">
          <Plus className="h-4 w-4" />
          {!collapse && t("create")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[560px] rounded-xl px-0">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-center">{t("appName")}</DialogTitle>
          <DialogDescription className="font-bold text-center">
            {t("appTip")}
          </DialogDescription>
        </DialogHeader>
        <BookOutlineForm />
      </DialogContent>
    </Dialog>
  )
}
