import type { MenuNode, MenuRow } from "./types";

export function buildMenuTree(rows: MenuRow[]): MenuNode[] {
  const map = new Map<string, MenuNode>();
  const roots: MenuNode[] = [];

  for (const row of rows) {
    map.set(row.wbs_code, { ...row, children: [] });
  }

  for (const row of rows) {
    const node = map.get(row.wbs_code);
    if (!node) continue;

    if (row.parent_wbs_code && map.has(row.parent_wbs_code)) {
      map.get(row.parent_wbs_code)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortNodes = (nodes: MenuNode[]) => {
    nodes.sort((a, b) => a.sort_order - b.sort_order || a.wbs_code.localeCompare(b.wbs_code));
    for (const node of nodes) sortNodes(node.children);
  };

  sortNodes(roots);
  return roots;
}
