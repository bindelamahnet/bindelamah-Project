"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronLeft, LogOut, Settings } from "lucide-react";
import type { MenuNode } from "@/lib/erp/types";
import { createClient } from "@/lib/supabase/client";

function findPathToKey(nodes: MenuNode[], key: string, path: string[] = []): string[] {
  for (const node of nodes) {
    const nextPath = [...path, node.wbs_code];
    if (node.wbs_code === key) return nextPath;
    const childPath = findPathToKey(node.children, key, nextPath);
    if (childPath.length) return childPath;
  }
  return [];
}

function findPathToSlug(nodes: MenuNode[], slug?: string, path: string[] = []): string[] {
  if (!slug) return [];
  for (const node of nodes) {
    const nextPath = [...path, node.wbs_code];
    if (node.slug === slug) return nextPath;
    const childPath = findPathToSlug(node.children, slug, nextPath);
    if (childPath.length) return childPath;
  }
  return [];
}

function collectDescendantKeys(item: MenuNode): string[] {
  return item.children.flatMap((child) => [child.wbs_code, ...collectDescendantKeys(child)]);
}

function defaultOpenKeys(nodes: MenuNode[]) {
  return new Set(nodes.map((item) => item.wbs_code));
}

function MenuItem({
  item,
  openKeys,
  activeKeys,
  activeKey,
  onBranchToggle,
  onLeafSelect
}: {
  item: MenuNode;
  openKeys: Set<string>;
  activeKeys: Set<string>;
  activeKey?: string;
  onBranchToggle: (item: MenuNode) => void;
  onLeafSelect: (item: MenuNode) => void;
}) {
  const open = openKeys.has(item.wbs_code);
  const hasChildren = item.children.length > 0;
  const href = `/dashboard/${item.slug}`;
  const centeredCodes = new Set(["0.1.1", "0.1.2"]);
  const isActive = activeKey === item.wbs_code;
  const isActiveAncestor = activeKeys.has(item.wbs_code) && !isActive;
  const itemClassName = [
    centeredCodes.has(item.wbs_code) ? "menu-item-centered" : "",
    isActive ? "menu-item-active" : "",
    isActiveAncestor ? "menu-item-active-parent" : ""
  ]
    .filter(Boolean)
    .join(" ");
  const itemClasses = itemClassName ? ` ${itemClassName}` : "";
  const isProjectHome = item.slug.endsWith("-home");

  return (
    <div className="menu-branch">
      {hasChildren && isProjectHome ? (
        <div className={`menu-linkable-branch${itemClasses}`} title={item.full_path_ar}>
          <Link href={href} onClick={() => onLeafSelect(item)}>
            <span>{item.name_ar}</span>
          </Link>
          <button type="button" aria-label={open ? "طي القائمة" : "فتح القائمة"} onClick={() => onBranchToggle(item)}>
            {open ? <ChevronDown size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      ) : hasChildren ? (
        <button
          type="button"
          className={`menu-button${itemClasses}`}
          onClick={() => onBranchToggle(item)}
          title={item.full_path_ar}
        >
          <span>{item.name_ar}</span>
          {open ? <ChevronDown size={16} /> : <ChevronLeft size={16} />}
        </button>
      ) : (
        <Link href={href} className={`menu-link${itemClasses}`} title={item.full_path_ar} onClick={() => onLeafSelect(item)}>
          <span>{item.name_ar}</span>
        </Link>
      )}

      {hasChildren && open ? (
        <div className={`menu-children${activeKeys.has(item.wbs_code) ? " menu-children-active" : ""}`}>
          {item.children.map((child) => (
            <MenuItem
              key={child.id}
              item={child}
              openKeys={openKeys}
              activeKeys={activeKeys}
              activeKey={activeKey}
              onBranchToggle={onBranchToggle}
              onLeafSelect={onLeafSelect}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [menu, setMenu] = useState<MenuNode[]>([]);
  const [openKeys, setOpenKeys] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const parts = pathname.split("/").filter(Boolean);
  const activeSlug = parts[0] === "dashboard" && parts.length > 1 ? parts.at(-1) : undefined;
  const activePath = findPathToSlug(menu, activeSlug);
  const activeKeys = new Set(activePath);
  const activeKey = activePath.at(-1);

  useEffect(() => {
    fetch("/api/menu")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "تعذر تحميل القائمة.");
        setMenu(data.menu ?? []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!menu.length) return;

    const parts = pathname.split("/").filter(Boolean);
    const activeSlug = parts[0] === "dashboard" && parts.length > 1 ? parts.at(-1) : undefined;
    const activePath = findPathToSlug(menu, activeSlug);
    setOpenKeys(activePath.length ? new Set(activePath) : defaultOpenKeys(menu));
  }, [menu, pathname]);

  function handleBranchToggle(item: MenuNode) {
    setOpenKeys((current) => {
      if (current.has(item.wbs_code)) {
        const next = new Set(current);
        next.delete(item.wbs_code);
        for (const descendant of collectDescendantKeys(item)) next.delete(descendant);
        return next;
      }

      return new Set(findPathToKey(menu, item.wbs_code));
    });
  }

  function handleLeafSelect(item: MenuNode) {
    setOpenKeys(new Set(findPathToKey(menu, item.wbs_code)));
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <aside className="sidebar" dir="rtl">
      <div className="sidebar-header">
        <img className="sidebar-logo" src="/bdcc-logo.jpg" alt="BDCC" />
        <div>
          <h1>BDCC ERP</h1>
          <p>القائمة الرئيسية</p>
        </div>
      </div>

      {loading ? <p className="sidebar-state">جاري تحميل القائمة...</p> : null}
      {error ? <p className="sidebar-error">{error}</p> : null}

      {!loading && !error ? (
        <nav className="menu-tree" aria-label="قائمة نظام BDCC ERP">
          {menu.map((item) => (
            <MenuItem
              key={item.id}
              item={item}
              openKeys={openKeys}
              activeKeys={activeKeys}
              activeKey={activeKey}
              onBranchToggle={handleBranchToggle}
              onLeafSelect={handleLeafSelect}
            />
          ))}
        </nav>
      ) : null}

      <div className="sidebar-actions">
        <Link href="/dashboard/settings" className="sidebar-action settings-action">
          <Settings size={16} />
          إعدادات النظام
        </Link>
        <button type="button" className="sidebar-action sign-out" onClick={signOut}>
          <LogOut size={16} />
          تسجيل الخروج
        </button>
      </div>
    </aside>
  );
}
