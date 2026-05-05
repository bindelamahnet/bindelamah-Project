"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, RotateCcw, Save, ShieldCheck } from "lucide-react";

type UserSummary = {
  id: string;
  email: string;
  full_name: string;
  roles: Array<{ id: string; code: string; name_ar: string }>;
};

type MenuPermission = {
  id: string;
  wbs_code: string;
  parent_wbs_code: string | null;
  name_ar: string;
  slug: string;
  full_path_ar: string;
  level: number;
  sort_order: number;
  can_view: boolean;
};

type Section = {
  root: MenuPermission;
  items: MenuPermission[];
};

export default function MenuPermissionsClient({ userId }: { userId: string }) {
  const [user, setUser] = useState<UserSummary | null>(null);
  const [menu, setMenu] = useState<MenuPermission[]>([]);
  const [originalMenu, setOriginalMenu] = useState<MenuPermission[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadPermissions() {
    setLoading(true);
    setError("");
    const response = await fetch(`/api/admin/users/${userId}/menu-permissions`);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(data.error ?? "تعذر تحميل صلاحيات المستخدم.");
      setLoading(false);
      return;
    }

    setUser(data.user ?? null);
    setMenu(data.menu ?? []);
    setOriginalMenu(data.menu ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadPermissions();
  }, [userId]);

  const sections = useMemo<Section[]>(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const allItems = [...menu].sort((a, b) => a.sort_order - b.sort_order || a.wbs_code.localeCompare(b.wbs_code));
    const rootByCode = new Map(allItems.filter((item) => !item.parent_wbs_code).map((item) => [item.wbs_code, item]));

    function rootFor(item: MenuPermission) {
      const firstCode = item.wbs_code.split(".")[0];
      return rootByCode.get(firstCode) ?? item;
    }

    const grouped = new Map<string, Section>();
    for (const item of allItems) {
      const matches =
        !normalizedSearch ||
        item.name_ar.toLowerCase().includes(normalizedSearch) ||
        item.wbs_code.toLowerCase().includes(normalizedSearch) ||
        item.full_path_ar.toLowerCase().includes(normalizedSearch);

      if (!matches) continue;

      const root = rootFor(item);
      const section = grouped.get(root.wbs_code) ?? { root, items: [] };
      section.items.push(item);
      grouped.set(root.wbs_code, section);
    }

    return Array.from(grouped.values()).sort(
      (a, b) => a.root.sort_order - b.root.sort_order || a.root.wbs_code.localeCompare(b.root.wbs_code)
    );
  }, [menu, search]);

  function setAll(canView: boolean, sectionCode?: string) {
    setMenu((items) =>
      items.map((item) => {
        if (!sectionCode || item.wbs_code === sectionCode || item.wbs_code.startsWith(`${sectionCode}.`)) {
          return { ...item, can_view: canView };
        }
        return item;
      })
    );
  }

  function toggleItem(menuItemId: string) {
    setMenu((items) =>
      items.map((item) => (item.id === menuItemId ? { ...item, can_view: !item.can_view } : item))
    );
  }

  async function savePermissions() {
    setSaving(true);
    setError("");
    setNotice("");

    const response = await fetch(`/api/admin/users/${userId}/menu-permissions`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        permissions: menu.map((item) => ({ menu_item_id: item.id, can_view: item.can_view }))
      })
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(data.error ?? "تعذر حفظ الصلاحيات.");
      setSaving(false);
      return;
    }

    setNotice("تم حفظ صلاحيات المستخدم بنجاح.");
    setOriginalMenu(menu);
    setSaving(false);
  }

  return (
    <div className="menu-permissions-workspace">
      <section className="menu-permissions-user-card">
        <div>
          <h3>{user?.full_name || "مستخدم النظام"}</h3>
          <p dir="ltr">{user?.email}</p>
          <span>{user?.roles.map((role) => role.name_ar).join("، ") || "غير محدد"}</span>
        </div>
        <Link href="/dashboard/settings/user-permissions" className="secondary-button">
          <ArrowRight size={17} />
          رجوع
        </Link>
      </section>

      <section className="menu-permissions-panel">
        <div className="menu-permissions-header">
          <div>
            <h3>
              <ShieldCheck size={20} />
              إدارة الصلاحيات
            </h3>
            <p>مسموح تعني ظهور القائمة وإمكانية استعراض الصفحة. محجوب تعني إخفاء القائمة عن المستخدم.</p>
          </div>
          <div className="menu-permissions-actions">
            <button type="button" className="secondary-button danger-outline" onClick={() => setMenu(originalMenu)}>
              <RotateCcw size={16} />
              إعادة تعيين
            </button>
            <button type="button" className="button" onClick={savePermissions} disabled={saving || loading}>
              <Save size={17} />
              {saving ? "جاري الحفظ..." : "حفظ"}
            </button>
          </div>
        </div>

        <input
          className="permissions-search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="بحث في الصلاحيات..."
        />

        {error ? <div className="error">{error}</div> : null}
        {notice ? <div className="success-message">{notice}</div> : null}
        {loading ? <p className="muted">جاري تحميل الصلاحيات...</p> : null}

        {!loading ? (
          <div className="menu-permissions-sections">
            <div className="permission-bulk-actions">
              <button type="button" className="allow-button" onClick={() => setAll(true)}>
                سماح للكل
              </button>
              <button type="button" className="block-button" onClick={() => setAll(false)}>
                حجب الكل
              </button>
            </div>

            {sections.map((section) => (
              <section className="menu-permission-section" key={section.root.wbs_code}>
                <header>
                  <div>
                    <h4>{section.root.name_ar}</h4>
                    <span>{section.root.wbs_code}</span>
                  </div>
                  <div className="permission-section-actions">
                    <button type="button" className="allow-button" onClick={() => setAll(true, section.root.wbs_code)}>
                      سماح بالكل
                    </button>
                    <button type="button" className="block-button" onClick={() => setAll(false, section.root.wbs_code)}>
                      حجب الكل
                    </button>
                  </div>
                </header>

                <div className="permission-list">
                  {section.items.map((item) => (
                    <div className="permission-item" key={item.id}>
                      <div className="permission-item-title" style={{ paddingRight: `${(item.level - 1) * 18}px` }}>
                        <strong>{item.name_ar}</strong>
                        <span>{item.full_path_ar}</span>
                      </div>
                      <div className="permission-state">
                        <button
                          type="button"
                          className={`permission-toggle ${item.can_view ? "is-allowed" : "is-blocked"}`}
                          aria-pressed={item.can_view}
                          onClick={() => toggleItem(item.id)}
                        >
                          <span />
                        </button>
                        <b className={item.can_view ? "state-allowed" : "state-blocked"}>
                          {item.can_view ? "مسموح" : "محجوب"}
                        </b>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}

            {!sections.length ? <p className="muted">لا توجد قوائم مطابقة للبحث.</p> : null}
          </div>
        ) : null}
      </section>
    </div>
  );
}
