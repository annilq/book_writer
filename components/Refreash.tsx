"use client";


import { RefreshCcw } from "lucide-react";
import { Message } from "ai/react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import useSWR from "swr";
import { Model } from "@/app/api/model/models";
import { useTranslation } from "react-i18next"
import { Button } from "./ui/button";


export function RefreashMessage({ model, refreshAssitant }: { model: string, refreshAssitant: (model: string) => void }) {
  const { data: models = [] } = useSWR<Model[]>('/api/model')
  const { t } = useTranslation()
  return (
    <div className="self-end  max-w-[80%]">
      <Select onValueChange={(data) => { refreshAssitant(data); }} defaultValue={model}>
        <SelectTrigger className="shadow-none border-none gap-1 focus:ring-0">
          <RefreshCcw className="h-4 w-4" /> <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {models.map(model => <SelectItem key={model.name} value={`${model.provider}/${model.name}`}>{model.name}/{model.provider}</SelectItem>)}
          <div className="text-center divide-y border-t border-teal-50">
            <Button size="sm" className="w-full" variant={"ghost"} onClick={() => refreshAssitant(model)}>{t("retry")}</Button>
          </div>
        </SelectContent>
      </Select>
    </div>
  );
}
