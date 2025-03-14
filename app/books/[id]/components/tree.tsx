/* eslint-disable react/display-name */
"use client";

import React from "react";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../../../components/ui/accordion";

export interface TreeData {
  id: string
  title: string
  content: string
  children?: TreeData[]
}

type TreeProps =
  React.HTMLAttributes<HTMLDivElement> &
  {
    data: TreeData[],
    initialSlelectedItemId?: string,
    onSelectChange?: (item: TreeData | undefined) => void,
    expandAll?: boolean,
    folderIcon?: LucideIcon,
    itemIcon?: LucideIcon
  }

const Tree = React.forwardRef<
  HTMLDivElement,
  TreeProps
>(({
  data, initialSlelectedItemId, onSelectChange, expandAll,
  folderIcon,
  itemIcon,
  ...props
}, ref) => {
  const [selectedItemId, setSelectedItemId] = React.useState<string | undefined>(initialSlelectedItemId)

  const handleSelectChange = React.useCallback((item: TreeData | undefined) => {
    setSelectedItemId(item?.id.toString());
    if (onSelectChange) {
      onSelectChange(item)
    }
  }, [onSelectChange]);

  const expandedItemIds = React.useMemo(() => {
    if (!initialSlelectedItemId) {
      return [] as string[]
    }

    const ids: string[] = []

    function walkTreeItems(items: TreeData[] | TreeData, targetId: string) {
      if (items instanceof Array) {
        for (let i = 0; i < items.length; i++) {
          ids.push(items[i]!.id.toString());
          if (walkTreeItems(items[i]!, targetId) && !expandAll) {
            return true;
          }
          if (!expandAll) ids.pop();
        }
      } else if (!expandAll && items.id?.toString() === targetId) {
        return true;
      } else if (items.children) {
        return walkTreeItems(items.children, targetId)
      }
    }

    walkTreeItems(data, initialSlelectedItemId)
    return ids;
  }, [data, expandAll, initialSlelectedItemId])


  return (
    <TreeItem
      data={data}
      ref={ref}
      selectedItemId={selectedItemId}
      handleSelectChange={handleSelectChange}
      expandedItemIds={expandedItemIds}
      FolderIcon={folderIcon}
      parentIndex={[]}
      ItemIcon={itemIcon}
      {...props}
    />
  )
})

type TreeItemProps =
  TreeProps &
  {
    selectedItemId?: string,
    handleSelectChange: (item: TreeData | undefined) => void,
    expandedItemIds: string[],
    FolderIcon?: LucideIcon,
    ItemIcon?: LucideIcon
    parentIndex: number[]
  }

const TreeItem = React.forwardRef<
  HTMLDivElement,
  TreeItemProps
>(({ parentIndex, className, data, selectedItemId, handleSelectChange, expandedItemIds, FolderIcon, ItemIcon, ...props }, ref) => {
  return (
    <div ref={ref} role="tree" className={className} {...props}>
      <ul>
        {
          data.map((item, index) => (
            <li key={item.id}>
              {item.children ? (
                <Accordion type="multiple" defaultValue={expandedItemIds}>
                  <AccordionItem value={item.id.toString()} className="border-none">
                    <AccordionTrigger
                      className={cn(
                        "px-2 ",
                        selectedItemId === item.id.toString() && " text-accent-foreground before:border-l-2 before:border-l-accent-foreground/50 dark:before:border-0"
                      )}
                      onClick={() => handleSelectChange(item)}
                    >
                      <div className="flex items-center gap-1">
                        <span>{[...parentIndex, index + 1].join(".")}</span>
                        <span className="text-sm truncate">{item.title}</span>
                      </div>

                    </AccordionTrigger>
                    <AccordionContent className="pl-2">
                      <TreeItem
                        data={item.children ? item.children : [item]}
                        parentIndex={[...parentIndex, index + 1]}
                        selectedItemId={selectedItemId}
                        handleSelectChange={handleSelectChange}
                        expandedItemIds={expandedItemIds}
                        FolderIcon={FolderIcon}
                        ItemIcon={ItemIcon}
                      />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              ) : (
                <Leaf
                  item={item}
                  index={[...parentIndex, index + 1]}
                  isSelected={selectedItemId === item.id.toString()}
                  onClick={() => handleSelectChange(item)}
                  Icon={ItemIcon}
                />
              )}
            </li>
          ))
        }
      </ul>
    </div>
  );
})

const Leaf = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    item: TreeData, isSelected?: boolean,
    index: number[],
    Icon?: LucideIcon
  }
>(({ className, index, item, isSelected, Icon, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center p-2 gap-1 cursor-pointer \
        hover:before:opacity-100 before:absolute before:left-0 before:right-1 before:w-full before:opacity-0 before:bg-muted/80 before:h-[1.75rem] before:-z-10",
        className,
        isSelected && "before:opacity-100 before:bg-accent text-accent-foreground before:border-l-2 before:border-l-accent-foreground/50 dark:before:border-0"
      )}
      {...props}
    >
      <span>{index.join(".")}</span>
      <span className="flex-grow text-sm truncate">{item.title}</span>
    </div>
  );
})


export { Tree, type TreeData }
