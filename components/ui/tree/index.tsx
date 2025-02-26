"use client";

import React from "react";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../accordion";

interface TreeDataItem {
  id: string;
  name: string;
  icon?: LucideIcon,
  children?: TreeDataItem[];
}

type TreeProps =
  React.HTMLAttributes<HTMLDivElement> &
  {
    data: TreeDataItem[] | TreeDataItem,
    initialSlelectedItemId?: string,
    onSelectChange?: (item: TreeDataItem | undefined) => void,
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

  const handleSelectChange = React.useCallback((item: TreeDataItem | undefined) => {
    setSelectedItemId(item?.id);
    if (onSelectChange) {
      onSelectChange(item)
    }
  }, [onSelectChange]);

  const expandedItemIds = React.useMemo(() => {
    if (!initialSlelectedItemId) {
      return [] as string[]
    }

    const ids: string[] = []

    function walkTreeItems(items: TreeDataItem[] | TreeDataItem, targetId: string) {
      if (items instanceof Array) {
        // eslint-disable-next-line @typescript-eslint/prefer-for-of
        for (let i = 0; i < items.length; i++) {
          ids.push(items[i]!.id);
          if (walkTreeItems(items[i]!, targetId) && !expandAll) {
            return true;
          }
          if (!expandAll) ids.pop();
        }
      } else if (!expandAll && items.id === targetId) {
        return true;
      } else if (items.children) {
        return walkTreeItems(items.children, targetId)
      }
    }

    walkTreeItems(data, initialSlelectedItemId)
    return ids;
  }, [data, initialSlelectedItemId])


  return (
    <TreeItem
      data={data}
      ref={ref}
      selectedItemId={selectedItemId}
      handleSelectChange={handleSelectChange}
      expandedItemIds={expandedItemIds}
      FolderIcon={folderIcon}
      ItemIcon={itemIcon}
      {...props}
    />
  )
})

type TreeItemProps =
  TreeProps &
  {
    selectedItemId?: string,
    handleSelectChange: (item: TreeDataItem | undefined) => void,
    expandedItemIds: string[],
    FolderIcon?: LucideIcon,
    ItemIcon?: LucideIcon
  }

const TreeItem = React.forwardRef<
  HTMLDivElement,
  TreeItemProps
>(({ className, data, selectedItemId, handleSelectChange, expandedItemIds, FolderIcon, ItemIcon, ...props }, ref) => {
  return (
    <div ref={ref} role="tree" className={className} {...props}><ul>
      {data instanceof Array ? (
        data.map((item) => (
          <li key={item.id}>
            {item.children ? (
              <Accordion type="multiple" defaultValue={expandedItemIds}>
                <AccordionItem value={item.id} className="border-none">
                  <AccordionTrigger
                    className={cn(
                      "px-2 hover:before:opacity-100 before:absolute before:left-0 before:w-full before:opacity-0 before:bg-muted/80 before:h-[1.75rem] before:-z-10",
                      selectedItemId === item.id && "before:opacity-100 before:bg-accent text-accent-foreground before:border-l-2 before:border-l-accent-foreground/50 dark:before:border-0"
                    )}
                    onClick={() => handleSelectChange(item)}
                  >
                    <div className="flex items-center">
                      {item.icon &&
                        <item.icon
                          className="h-4 w-4 shrink-0 mr-1 text-accent-foreground/50"
                          aria-hidden="true"
                        />
                      }
                      {!item.icon && FolderIcon &&
                        <FolderIcon
                          className="h-4 w-4 shrink-0 mr-1 text-accent-foreground/50"
                          aria-hidden="true"
                        />
                      }
                      <span className="text-sm truncate">{item.name}</span>
                    </div>

                  </AccordionTrigger>
                  <AccordionContent className="pl-2">
                    <TreeItem
                      data={item.children ? item.children : item}
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
                isSelected={selectedItemId === item.id}
                onClick={() => handleSelectChange(item)}
                Icon={ItemIcon}
              />
            )}
          </li>
        ))
      ) : (
        <li>
          <Leaf
            item={data}
            isSelected={selectedItemId === data.id}
            onClick={() => handleSelectChange(data)}
            Icon={ItemIcon}
          />
        </li>
      )}
    </ul></div>
  );
})

const Leaf = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    item: TreeDataItem, isSelected?: boolean,
    Icon?: LucideIcon
  }
>(({ className, item, isSelected, Icon, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center p-2 cursor-pointer \
        hover:before:opacity-100 before:absolute before:left-0 before:right-1 before:w-full before:opacity-0 before:bg-muted/80 before:h-[1.75rem] before:-z-10",
        className,
        isSelected && "before:opacity-100 before:bg-accent text-accent-foreground before:border-l-2 before:border-l-accent-foreground/50 dark:before:border-0"
      )}
      {...props}
    >
      {item.icon && <item.icon className="h-4 w-4 shrink-0 mr-1 text-accent-foreground/50" aria-hidden="true" />}
      {!item.icon && Icon && <Icon className="h-4 w-4 shrink-0 mr-1 text-accent-foreground/50" aria-hidden="true" />}
      <span className="flex-grow text-sm truncate">{item.name}</span>
    </div>
  );
})


export { Tree, type TreeDataItem }
