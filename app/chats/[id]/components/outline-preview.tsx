"use client"

import * as React from "react"
import { Tree, Data as TreeData } from "@/components/tree";

import { extractFirstCodeBlock, getOutlineMessage } from "@/utils";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { t } from "i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { moveNode, updateNode } from "@/components/tree/util";
import { updateMessage } from "@/app/api/chat/actions";
import { useMessageStore } from "@/store/message";
import { useErrorStore } from "@/store/error";
import { ErrorMessage } from "@/components/GenerateErrorhandle";

const FormSchema = z.object({
  title: z.string().min(2, {
    message: "Chapter Title must be at least 2 characters.",
  }),
  content: z.string().optional(),
})

export default function SidebarPreview({ onRequestFix }: { onRequestFix: (message: string) => void }) {
  const [treeData, setTreeData] = React.useState<TreeData[]>([])
  const [chapter, setChapter] = React.useState<TreeData>()
  const { message, setActiveMessage } = useMessageStore()
  const { setError } = useErrorStore()

  React.useEffect(() => {
    if (message) {
      const app = extractFirstCodeBlock(message.content)!;
      try {
        const newdata = JSON.parse(app.code)
        setTreeData(newdata)
        setError()
      } catch (e: Error) {
        setError(e.message)
      }

    }
  }, [message])

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      title: "",
      content: "",
    },
  })

  async function onSubmit(values: z.infer<typeof FormSchema>) {
    const updateData = updateNode(treeData, { ...chapter!, ...values })
    const content = getOutlineMessage(updateData)
    const newMessage = await updateMessage(message!.id, content)
    if (newMessage) {
      setActiveMessage(newMessage)
    }
  }

  return (
    <div className="flex flex-1 gap-2 overflow-y-auto bg-background">
      {treeData?.length > 0 ? (
        <Tree
          data={treeData}
          className="w-1/3 bg-secondary overflow-y-auto text-sm px-2"
          onActivate={(node) => { setChapter(node.data); form.reset(node.data) }}
          onMove={async (data) => {
            const updateData = moveNode(treeData, data)
            setTreeData(updateData)
          }}
        />
      ) : false}
      <div className="flex-1">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mx-auto space-y-4 p-4 flex flex-col">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem className="flex flex-col flex-1">
                  <FormControl>
                    <Textarea
                      className="flex-1"
                      rows={8}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center gap-4">
              <Button type="submit" className="w-full">
                {t("save")}
              </Button>
            </div>
          </form>
        </Form>
      </div>
      {onRequestFix && <ErrorMessage onRequestFix={onRequestFix} />}
    </div>
  )
}
