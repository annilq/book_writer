import { cn } from "@/utils";
import { ChevronDown, ChevronRight } from "lucide-react";
import React from "react";
import { NodeApi, NodeRendererProps, Tree as ArboristTree } from "react-arborist";
import { TreeProps } from "react-arborist/dist/module/types/tree-props";
import useResizeObserver from "use-resize-observer";

export type Data = { id: string; title: string; content: string; description: string; children?: Data[] };

const INDENT_STEP = 16;

export function Tree(props: TreeProps<Data> & { renderSuffix: (node: NodeApi<Data>) => React.ReactNode }) {
  const { ref, width, height } = useResizeObserver();

  return (
    <div ref={ref} className={cn("h-full", props.className)}>
      <ArboristTree
        {...props}
        width={width}
        height={height}
        openByDefault={true}
        padding={15}
        rowHeight={30}
        indent={INDENT_STEP}
      >
        {(nodeProps) => {
          return <Node {...nodeProps} renderSuffix={props.renderSuffix} />
        }}
      </ArboristTree>
    </div>
  );
}

function Node({ node, style, dragHandle, renderSuffix = (node) => false }: NodeRendererProps<Data> & { renderSuffix: (node: NodeApi<Data>) => React.ReactNode }) {

  return (
    <div
      ref={dragHandle}
      className={cn((node.level === 0) && "font-bold", !node.isInternal && node.isSelected && "rounded bg-card-foreground text-card", "h-full flex gap-2 items-center justify-between cursor-pointer hover:underline px-2 mx-2")}
      style={style}
      onClick={() => node.isInternal && node.toggle()}
    >
      <span className="flex-1" >
        {node.data.title}
      </span>
      {!!node.children?.length && <FolderArrow node={node} />}
      {renderSuffix(node)}
    </div>
  );
}


function FolderArrow({ node }: { node: NodeApi<Data> }) {
  return (
    <span>
      {node.isInternal ? (
        node.isOpen ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )
      ) : null}
    </span>
  );
}