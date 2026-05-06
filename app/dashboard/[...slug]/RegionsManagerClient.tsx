"use client";

import { FormEvent, useEffect, useState } from "react";
import { Edit3, Plus, Trash2 } from "lucide-react";

type Region = {
  index: number;
  id: string;
  code: string;
  name_ar: string;
  project_count: number;
};

export default function RegionsManagerClient() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [nameAr, setNameAr] = useState("");
  const [code, setCode] = useState("");
  const [editing, setEditing] = useState<Region | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadRegions() {
    setLoading(true);
    setError("");
    const response = await fetch("/api/admin/regions");
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(data.error ?? "تعذر تحميل المناطق.");
      setLoading(false);
      return;
    }

    setRegions(data.regions ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadRegions();
  }, []);

  async function submitRegion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    const response = await fetch("/api/admin/regions", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing ? { id: editing.id, name_ar: nameAr } : { name_ar: nameAr, code })
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(data.error ?? "تعذر حفظ المنطقة.");
      setSaving(false);
      return;
    }

    setRegions(data.regions ?? []);
    setNameAr("");
    setCode("");
    setEditing(null);
    setNotice(editing ? "تم تعديل المنطقة بنجاح." : "تمت إضافة المنطقة بنجاح وستظهر تحت مشاريع الكهرباء.");
    setSaving(false);
  }

  async function deleteRegion(region: Region) {
    setError("");
    setNotice("");
    const response = await fetch(`/api/admin/regions?id=${region.id}&code=${encodeURIComponent(region.code)}`, {
      method: "DELETE"
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(data.error ?? "تعذر حذف المنطقة.");
      return;
    }

    setRegions(data.regions ?? []);
    setNotice("تم حذف المنطقة.");
  }

  function startEdit(region: Region) {
    setEditing(region);
    setNameAr(region.name_ar);
    setCode(region.code);
  }

  return (
    <section className="module-panel regions-manager-panel">
      <div className="section-title-row">
        <div>
          <h3>المناطق</h3>
          <p>أي منطقة تُضاف هنا ستظهر تحت مشاريع الكهرباء، وتحتها المشاريع المرتبطة بها حسب المنطقة.</p>
        </div>
      </div>

      <form className="regions-form" onSubmit={submitRegion}>
        <div className="field">
          <label htmlFor="region_name">اسم المنطقة *</label>
          <input
            id="region_name"
            value={nameAr}
            onChange={(event) => setNameAr(event.target.value)}
            placeholder="مثال: الرياض"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="region_code">رمز المنطقة</label>
          <input
            id="region_code"
            dir="ltr"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            disabled={Boolean(editing)}
            placeholder="مثال: riyadh"
          />
        </div>
        <div className="permissions-form-actions">
          <button type="submit" className="button" disabled={saving}>
            <Plus size={17} />
            {saving ? "جاري الحفظ..." : editing ? "حفظ التعديل" : "إضافة منطقة"}
          </button>
          {editing ? (
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                setEditing(null);
                setNameAr("");
                setCode("");
              }}
            >
              إلغاء
            </button>
          ) : null}
        </div>
      </form>

      {error ? <div className="error">{error}</div> : null}
      {notice ? <div className="success-message">{notice}</div> : null}

      <div className="users-table-wrap">
        <table className="users-table regions-table">
          <thead>
            <tr>
              <th>#</th>
              <th>اسم المنطقة</th>
              <th>عدد المشاريع</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4}>جاري تحميل المناطق...</td>
              </tr>
            ) : null}
            {!loading && regions.map((region) => (
              <tr key={region.id}>
                <td>{region.index}</td>
                <td>{region.name_ar}</td>
                <td>
                  <span className="count-badge">{region.project_count}</span>
                </td>
                <td>
                  <div className="table-actions">
                    <button type="button" className="table-action edit-action" onClick={() => startEdit(region)}>
                      <Edit3 size={15} />
                      تعديل
                    </button>
                    <button type="button" className="table-action delete-action" onClick={() => deleteRegion(region)}>
                      <Trash2 size={15} />
                      حذف
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && !regions.length ? (
              <tr>
                <td colSpan={4}>لا توجد مناطق للعرض.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
