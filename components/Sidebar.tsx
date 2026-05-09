"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
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

function defaultOpenKeys(nodes: MenuNode[]) {
  return new Set(nodes.map((item) => item.wbs_code));
}

function MenuItem({
  item,
  depth = 0,
  openKeys,
  activePath,
  activeKeys,
  activeKey,
  onBranchToggle,
  onLeafSelect
}: {
  item: MenuNode;
  depth?: number;
  openKeys: Set<string>;
  activePath: string[];
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
  const activePathIndex = activePath.indexOf(item.wbs_code);
  const activeChildCode = activePathIndex >= 0 ? activePath[activePathIndex + 1] : undefined;
  const visibleChildren =
    activeChildCode && item.wbs_code !== activeKey
      ? item.children.filter((child) => child.wbs_code === activeChildCode)
      : item.children;
  const depthBackgrounds = ["transparent", "#f7fbff", "#f5f9fc", "#f3f6fa", "#f0f3f7", "#edf1f5"];
  const depthIndex = Math.min(depth, depthBackgrounds.length - 1);
  const branchStyle = {
    "--menu-indent": `${Math.min(depth, 5) * 7}px`,
    "--menu-depth-bg": depthBackgrounds[depthIndex],
    "--menu-children-bg": depthBackgrounds[Math.min(depth + 1, depthBackgrounds.length - 1)]
  } as CSSProperties;

  return (
    <div className={`menu-branch${depth > 0 ? " menu-branch-nested" : ""}`} style={branchStyle}>
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
          {visibleChildren.map((child) => (
            <MenuItem
              key={child.id}
              item={child}
              depth={depth + 1}
              openKeys={openKeys}
              activePath={activePath}
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
  const [selectedPath, setSelectedPath] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const parts = pathname.split("/").filter(Boolean);
  const activeSlug = parts[0] === "dashboard" && parts.length > 1 ? parts.at(-1) : undefined;
  const routeActivePath = findPathToSlug(menu, activeSlug);
  const activePath = selectedPath.length ? selectedPath : routeActivePath;
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
    setSelectedPath(activePath);
    setOpenKeys(activePath.length ? new Set(activePath) : defaultOpenKeys(menu));
  }, [menu, pathname]);

  function handleBranchToggle(item: MenuNode) {
    const path = findPathToKey(menu, item.wbs_code);
    setSelectedPath(path);
    setOpenKeys(new Set(path));
  }

  function handleLeafSelect(item: MenuNode) {
    const path = findPathToKey(menu, item.wbs_code);
    setSelectedPath(path);
    setOpenKeys(new Set(path));
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
          {(activePath.length ? menu.filter((item) => item.wbs_code === activePath[0]) : menu).map((item) => (
            <MenuItem
              key={item.id}
              item={item}
              openKeys={openKeys}
              activePath={activePath}
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
