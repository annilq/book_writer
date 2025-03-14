import { cn } from "@/utils";
import { ChevronDown, ChevronRight } from "lucide-react";
import { NodeApi, NodeRendererProps, Tree as ArboristTree } from "react-arborist";
import { TreeProps } from "react-arborist/dist/module/types/tree-props";
import useResizeObserver from "use-resize-observer";

export type Data = { id: string; title: string; content: string; children?: Data[] };

const INDENT_STEP = 16;

export function Tree(props: TreeProps<Data>) {
  const { ref, width, height } = useResizeObserver();

  return (
    <div ref={ref} className="h-full">
      <ArboristTree
        {...props}
        width={width}
        height={height}
        openByDefault={true}
        padding={15}
        rowHeight={30}
        indent={INDENT_STEP}
      >
        {Node}
      </ArboristTree>
    </div>

  );
}

function Node({ node, style, dragHandle }: NodeRendererProps<Data>) {

  return (
    <div
      ref={dragHandle}
      className={cn(node.isInternal && "font-bold", "flex gap-2 items-center justify-between cursor-pointer hover:underline mx-4")}
      style={style}
      onClick={() => node.isInternal && node.toggle()}
    >
      <span className="flex-1" >
        {node.data.title}
      </span>
      <FolderArrow node={node} />
    </div>
  );
}


function FolderArrow({ node }: { node: NodeApi<Data> }) {
  return (
    <span>
      {node.isInternal ? (
        node.isOpen ? (
          <ChevronDown />
        ) : (
          <ChevronRight />
        )
      ) : null}
    </span>
  );
}