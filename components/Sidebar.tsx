"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronDown, ChevronLeft, LogOut, Settings } from "lucide-react";
import type { MenuNode } from "@/lib/erp/types";
import { createClient } from "@/lib/supabase/client";

function MenuItem({ item }: { item: MenuNode }) {
  const [open, setOpen] = useState(item.level <= 2);
  const hasChildren = item.children.length > 0;
  const href = `/dashboard/${item.slug}`;
  const centeredCodes = new Set(["0.1.1", "0.1.2"]);
  const itemClassName = centeredCodes.has(item.wbs_code) ? " menu-item-centered" : "";

  return (
    <div className="menu-branch">
      {hasChildren ? (
        <button
          type="button"
          className={`menu-button${itemClassName}`}
          onClick={() => setOpen((value) => !value)}
          title={item.full_path_ar}
        >
          <span>{item.name_ar}</span>
          {open ? <ChevronDown size={16} /> : <ChevronLeft size={16} />}
        </button>
      ) : (
        <Link href={href} className={`menu-link${itemClassName}`} title={item.full_path_ar}>
          <span>{item.name_ar}</span>
        </Link>
      )}

      {hasChildren && open ? (
        <div className="menu-children">
          {item.children.map((child) => (
            <MenuItem key={child.id} item={child} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function Sidebar() {
  const [menu, setMenu] = useState<MenuNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
            <MenuItem key={item.id} item={item} />
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
