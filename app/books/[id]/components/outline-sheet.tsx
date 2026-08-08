"use client";

import { useState } from "react";
import { Book, Chapter } from "@prisma/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ListTree } from "lucide-react";
import Tree from "@/components/tree";
import { buildToc } from "./toc";

export default function OutlineSheet({ book }: { book: Book & { chapters: Chapter[] } }) {
  const [open, setOpen] = useState(false);
  const nodes = buildToc(book);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-brand">
          <ListTree className="h-4 w-4" />
          Contents
        </Button>
      </SheetTrigger>
      <SheetContent className="w-80 p-0">
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle className="flex items-center gap-2 text-sm">
            <ListTree className="h-4 w-4 text-brand" />
            Contents
          </SheetTitle>
        </SheetHeader>
        <div className="overflow-y-auto p-3">
          <Tree
            nodes={nodes}
            onChange={(id) => {
              setOpen(false);
              setTimeout(() => {
                document
                  .getElementById(`chapter-${id}`)
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              }, 150);
            }}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
