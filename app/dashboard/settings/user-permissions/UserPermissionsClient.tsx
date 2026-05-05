"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Edit3, Plus, ShieldCheck, Trash2, UserPlus } from "lucide-react";

type Role = {
  id: string;
  code: string;
  name_ar: string;
};

type UserRow = {
  index: number;
  id: string;
  email: string;
  full_name: string;
  region_code: string;
  roles: Array<{ code: string; name_ar: string }>;
};

const initialForm = {
  full_name: "",
  email: "",
  password: "",
  confirm_password: "",
  role_code: "viewer",
  region_code: "0"
};

export default function UserPermissionsClient() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [form, setForm] = useState(initialForm);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const roleOptions = useMemo(() => roles.filter((role) => role.code !== "super_admin"), [roles]);

  async function loadUsers() {
    setLoading(true);
    setError("");
    const response = await fetch("/api/admin/users");
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(data.error ?? "تعذر تحميل المستخدمين.");
      setLoading(false);
      return;
    }

    setUsers(data.users ?? []);
    setRoles(data.roles ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setSaving(true);

    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(data.error ?? "تعذر إضافة المستخدم.");
      setSaving(false);
      return;
    }

    setNotice("تمت إضافة المستخدم بنجاح.");
    setForm(initialForm);
    setShowForm(false);
    setSaving(false);
    await loadUsers();
  }

  return (
    <div className="permissions-workspace">
      <div className="permissions-toolbar">
        <button type="button" className="button permissions-add-button" onClick={() => setShowForm((value) => !value)}>
          <Plus size={18} />
          إضافة مستخدم
        </button>
      </div>

      {showForm ? (
        <section className="permissions-form-panel" aria-label="إضافة مستخدم">
          <div className="permissions-form-header">
            <UserPlus size={22} />
            <h3>إضافة مستخدم</h3>
          </div>

          <form className="permissions-form" onSubmit={onSubmit}>
            <div className="field">
              <label htmlFor="full_name">الاسم *</label>
              <input
                id="full_name"
                value={form.full_name}
                onChange={(event) => setForm({ ...form, full_name: event.target.value })}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="email">البريد الإلكتروني *</label>
              <input
                id="email"
                type="email"
                dir="ltr"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="password">كلمة المرور *</label>
              <input
                id="password"
                type="password"
                dir="ltr"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="confirm_password">تأكيد كلمة المرور *</label>
              <input
                id="confirm_password"
                type="password"
                dir="ltr"
                value={form.confirm_password}
                onChange={(event) => setForm({ ...form, confirm_password: event.target.value })}
                required
              />
            </div>
            <div className="field permissions-wide-field">
              <label htmlFor="role_code">الصلاحية *</label>
              <select
                id="role_code"
                value={form.role_code}
                onChange={(event) => setForm({ ...form, role_code: event.target.value })}
              >
                {(roleOptions.length ? roleOptions : roles).map((role) => (
                  <option key={role.code} value={role.code}>
                    {role.name_ar}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="region_code">المنطقة</label>
              <select
                id="region_code"
                value={form.region_code}
                onChange={(event) => setForm({ ...form, region_code: event.target.value })}
              >
                <option value="0">كافة المناطق / غير محدد</option>
                <option value="jazan">جازان</option>
                <option value="makkah">مكة المكرمة</option>
              </select>
            </div>

            <div className="permissions-form-actions">
              <button type="submit" className="button" disabled={saving}>
                {saving ? "جاري الحفظ..." : "حفظ"}
              </button>
              <button type="button" className="secondary-button" onClick={() => setShowForm(false)}>
                إلغاء
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {error ? <div className="error">{error}</div> : null}
      {notice ? <div className="success-message">{notice}</div> : null}

      <section className="users-table-panel" aria-label="جدول المستخدمين">
        {loading ? <p className="muted">جاري تحميل المستخدمين...</p> : null}
        {!loading ? (
          <div className="users-table-wrap">
            <table className="users-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>الاسم</th>
                  <th>البريد الإلكتروني</th>
                  <th>الصلاحية</th>
                  <th>المنطقة</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.index}</td>
                    <td>{user.full_name || "غير محدد"}</td>
                    <td dir="ltr">{user.email}</td>
                    <td>
                      <span className="role-badge">{user.roles[0]?.name_ar ?? "غير محدد"}</span>
                    </td>
                    <td>{user.region_code === "0" ? "غير محدد" : user.region_code}</td>
                    <td>
                      <div className="table-actions">
                        <button type="button" className="table-action edit-action">
                          <Edit3 size={15} />
                          تعديل
                        </button>
                        <Link
                          href={`/dashboard/settings/user-permissions/${user.id}`}
                          className="table-action permissions-action"
                        >
                          <ShieldCheck size={15} />
                          صلاحيات
                        </Link>
                        <button type="button" className="table-action delete-action">
                          <Trash2 size={15} />
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!users.length ? (
                  <tr>
                    <td colSpan={6}>لا يوجد مستخدمون للعرض.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
}
