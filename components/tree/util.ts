import { Data } from ".";
import { produce } from "immer";
import { NodeApi } from "react-arborist";

export const moveNode = (data: Data[], { dragIds, parentId, index }: {
  dragIds: string[];
  dragNodes: NodeApi<Data>[];
  parentId: string | null;
  parentNode: NodeApi<Data> | null;
  index: number;
}): Data[] => {

  return produce(data, draft => {
    const [moveId] = dragIds;

    const findAndRemoveNode = (items: Data[]): Data | undefined => {
      for (let i = 0; i < items.length; i++) {
        if (items[i].id === moveId) {
          return items.splice(i, 1)[0];
        }
        if (items[i].children) {
          const found = findAndRemoveNode(items[i].children!);
          if (found) return found;
        }
      }
      return undefined;
    }

    const findParentAndInsert = (items: Data[], node: Data) => {

      for (let i = 0; i < items.length; i++) {
        if (items[i].id === parentId) {
          items[i].children!.splice(index, 0, node);
          return true;
        }
        if (items[i].children) {
          if (findParentAndInsert(items[i].children!, node)) {
            return true;
          }
        }
      }
      return false;
    }

    const nodeToMove = findAndRemoveNode(draft);

    if (nodeToMove) {
      findParentAndInsert(draft, nodeToMove);
    }
  });
}

export const updateNode = (data: Data[], node: Data): Data[] => {

  return produce(data, draft => {

    const findAndUpdateNode = (items: Data[]): Data | undefined => {
      for (let i = 0; i < items.length; i++) {
        if (items[i].id === node.id) {
          return items[i] = { ...items[i], ...node };
        }
        if (items[i].children) {
          findAndUpdateNode(items[i].children!);
        }
      }
      return undefined;
    }

    findAndUpdateNode(draft);
  });
}
export const removeNode = (data: Data[], node: Data): Data[] => {

  return produce(data, draft => {

    const findAndRemoveNode = (items: Data[]): Data | undefined => {
      for (let i = 0; i < items.length; i++) {
        if (items[i].id === node.id) {
          return items.splice(i, 1)[0];
        }
        if (items[i].children) {
          const found = findAndRemoveNode(items[i].children!);
          if (found) return found;
        }
      }
      return undefined;
    }
    findAndRemoveNode(draft);
  });
}