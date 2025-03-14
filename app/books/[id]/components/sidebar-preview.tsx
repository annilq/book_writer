"use client"

import * as React from "react"
// import { Tree, TreeData } from "./tree";
import { Tree, Data as TreeData } from "@/components/tree";

import { v4 as uuidv4 } from 'uuid';
import { ChapterInput } from "@/utils";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { t } from "i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { moveNode, updateNode } from "@/components/tree/util";

const transformData = (chapter: ChapterInput): TreeData => {
  return {
    id: uuidv4(),
    title: chapter.title,
    content: chapter.content,
    ...(chapter.children && chapter.children?.length > 0 && { children: chapter.children?.map(transformData) })
  }
}

const FormSchema = z.object({
  title: z.string().min(2, {
    message: "Chapter Title must be at least 2 characters.",
  }),
  content: z.string().optional(),
})

export default function SidebarPreview({ data }: { data: string }) {
  const treeRef = React.useRef()
  const [treeData, setTreeData] = React.useState<TreeData[]>([])
  const [chapter, setChapter] = React.useState<TreeData>()

  React.useEffect(() => {
    if (data) {
      const newdata = JSON.parse(data)
      setTreeData(newdata.map(transformData))
    }
  }, [data])

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      title: "",
      content: "",
    },
  })

  async function onSubmit(values: z.infer<typeof FormSchema>) {
    const updateData = updateNode(treeData, { ...chapter!, ...values })
    setTreeData(updateData)
  }

  return (
    <div className="flex h-full gap-2">
      {treeData?.length > 0 ? (
        <Tree
          ref={treeRef}
          data={treeData}
          className="min-w-1/3 bg-muted h-full overflow-y-auto text-sm px-2"
          onActivate={(node) => { setChapter(node.data); form.reset(node.data) }}
          onMove={async (data) => {
            console.log(data);
            const updateData = moveNode(treeData, data)
            setTreeData(updateData)
          }}
        />
      ) : false}
      <div className="flex-1">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mx-auto space-y-4 p-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem className="flex-1">
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
                <FormItem>
                  <FormControl>
                    <Textarea
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
    </div>
  )
}
