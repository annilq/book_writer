export type TocNode = {
  id: number;
  title: string;
  position: string;
  level: number;
  isInternal: boolean;
  children: TocNode[];
};

type ChapterLike = { id: number; title: string; position: string };

function isAncestor(prefix: string, full: string) {
  return full.startsWith(prefix + ".");
}

/** Build a nested table-of-contents tree from flat chapters keyed by their dotted `position` path. */
export function buildToc(book: { chapters: ChapterLike[] }): TocNode[] {
  const nodes = book.chapters
    .map((c) => ({
      id: c.id,
      title: c.title,
      position: c.position,
      level: c.position.split(".").length - 1,
      isInternal: false,
      children: [] as TocNode[],
    }))
    .sort((a, b) =>
      a.position.localeCompare(b.position, undefined, { numeric: true })
    );

  const root: TocNode[] = [];
  const stack: TocNode[] = [];

  for (const node of nodes) {
    while (stack.length && !isAncestor(stack[stack.length - 1].position, node.position)) {
      stack.pop();
    }
    if (stack.length === 0) {
      root.push(node);
    } else {
      const parent = stack[stack.length - 1];
      parent.children.push(node);
      parent.isInternal = true;
    }
    stack.push(node);
  }

  return root;
}
