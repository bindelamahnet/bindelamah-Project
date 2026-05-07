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
  can_create: boolean;
  can_update: boolean;
  can_delete: boolean;
  can_approve: boolean;
};

type Section = {
  root: MenuPermission;
  items: MenuPermission[];
};

type PermissionKey = "can_create" | "can_update" | "can_delete" | "can_approve";

const actionPermissions: Array<{ key: PermissionKey; label: string }> = [
  { key: "can_create", label: "إضافة" },
  { key: "can_update", label: "تعديل" },
  { key: "can_delete", label: "حذف" },
  { key: "can_approve", label: "اعتماد" }
];

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
          return {
            ...item,
            can_view: canView,
            can_create: canView ? item.can_create : false,
            can_update: canView ? item.can_update : false,
            can_delete: canView ? item.can_delete : false,
            can_approve: canView ? item.can_approve : false
          };
        }
        return item;
      })
    );
  }

  function normalizeHierarchy(items: MenuPermission[]) {
    const itemByCode = new Map(items.map((item) => [item.wbs_code, item]));
    return items.map((item) => {
      const next = { ...item };
      if (!next.can_view) {
        next.can_create = false;
        next.can_update = false;
        next.can_delete = false;
        next.can_approve = false;
      }

      let parentCode = item.parent_wbs_code;
      while (parentCode) {
        const parent = itemByCode.get(parentCode);
        if (!parent?.can_view) {
          next.can_view = false;
          next.can_create = false;
          next.can_update = false;
          next.can_delete = false;
          next.can_approve = false;
          return next;
        }
        for (const action of actionPermissions) {
          if (!parent[action.key]) {
            next[action.key] = false;
          }
        }
        parentCode = parent.parent_wbs_code;
      }
      return next;
    });
  }

  function toggleItem(menuItemId: string) {
    setMenu((items) => {
      const target = items.find((item) => item.id === menuItemId);
      if (!target) return items;

      const nextCanView = !target.can_view;
      const ancestors = new Set<string>();
      const itemByCode = new Map(items.map((item) => [item.wbs_code, item]));
      let parentCode = target.parent_wbs_code;

      while (parentCode) {
        ancestors.add(parentCode);
        parentCode = itemByCode.get(parentCode)?.parent_wbs_code ?? null;
      }

      const updated = items.map((item) => {
        const isTarget = item.id === target.id;
        const isDescendant = item.wbs_code.startsWith(`${target.wbs_code}.`);

        if (!nextCanView && (isTarget || isDescendant)) {
          return {
            ...item,
            can_view: false,
            can_create: false,
            can_update: false,
            can_delete: false,
            can_approve: false
          };
        }

        if (nextCanView && (isTarget || ancestors.has(item.wbs_code))) {
          return { ...item, can_view: true };
        }

        return item;
      });

      return normalizeHierarchy(updated);
    });
  }

  function toggleAction(menuItemId: string, key: PermissionKey) {
    setMenu((items) => {
      const target = items.find((item) => item.id === menuItemId);
      if (!target || !target.can_view) return items;

      const nextValue = !target[key];
      const ancestors = new Set<string>();
      const itemByCode = new Map(items.map((item) => [item.wbs_code, item]));
      let parentCode = target.parent_wbs_code;

      while (parentCode) {
        ancestors.add(parentCode);
        parentCode = itemByCode.get(parentCode)?.parent_wbs_code ?? null;
      }

      const updated = items.map((item) => {
        const isTarget = item.id === target.id;
        const isDescendant = item.wbs_code.startsWith(`${target.wbs_code}.`);

        if (!nextValue && (isTarget || isDescendant)) {
          return { ...item, [key]: false };
        }

        if (nextValue && (isTarget || ancestors.has(item.wbs_code))) {
          return { ...item, can_view: true, [key]: true };
        }

        return item;
      });

      return normalizeHierarchy(updated);
    });
  }

  async function savePermissions() {
    setSaving(true);
    setError("");
    setNotice("");
    const normalizedMenu = normalizeHierarchy(menu);

    const response = await fetch(`/api/admin/users/${userId}/menu-permissions`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        permissions: normalizedMenu.map((item) => ({
          menu_item_id: item.id,
          can_view: item.can_view,
          can_create: item.can_create,
          can_update: item.can_update,
          can_delete: item.can_delete,
          can_approve: item.can_approve
        }))
      })
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(data.error ?? "تعذر حفظ الصلاحيات.");
      setSaving(false);
      return;
    }

    setNotice("تم حفظ صلاحيات المستخدم بنجاح.");
    setMenu(normalizedMenu);
    setOriginalMenu(normalizedMenu);
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
                        {item.can_view ? (
                          <div className="permission-action-pills" aria-label="صلاحيات الإجراءات">
                            {actionPermissions.map((action) => (
                              <button
                                type="button"
                                key={action.key}
                                className={`permission-action-pill ${item[action.key] ? "is-active" : ""}`}
                                aria-pressed={item[action.key]}
                                onClick={() => toggleAction(item.id, action.key)}
                              >
                                {action.label}
                              </button>
                            ))}
                          </div>
                        ) : null}
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
