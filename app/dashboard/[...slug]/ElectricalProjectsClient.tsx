"use client";

import { FormEvent, useState } from "react";
import { Plus } from "lucide-react";

type Company = {
  id: string;
  name_ar: string;
};

type RegionCard = {
  code: string;
  name: string;
  count: number;
};

const knownRegions = [
  { code: "jazan", name: "جازان" },
  { code: "makkah", name: "مكة المكرمة" },
  { code: "riyadh", name: "الرياض" },
  { code: "eastern", name: "المنطقة الشرقية" },
  { code: "madinah", name: "المدينة المنورة" },
  { code: "qassim", name: "القصيم" },
  { code: "aseer", name: "عسير" },
  { code: "tabuk", name: "تبوك" },
  { code: "hail", name: "حائل" },
  { code: "northern_borders", name: "الحدود الشمالية" },
  { code: "jawf", name: "الجوف" },
  { code: "baha", name: "الباحة" },
  { code: "najran", name: "نجران" }
];

export default function ElectricalProjectsClient({
  companies,
  regions
}: {
  companies: Company[];
  regions: RegionCard[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({
    company_id: companies[0]?.id ?? "",
    project_no: "",
    name_ar: "",
    region_code: knownRegions[0].code,
    new_region_code: ""
  });

  async function submitProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    const regionCode = form.new_region_code.trim() || form.region_code;
    const response = await fetch("/api/admin/electrical-projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, region_code: regionCode })
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(data.error ?? "تعذر إضافة مشروع الكهرباء.");
      setSaving(false);
      return;
    }

    setNotice("تمت إضافة مشروع الكهرباء بنجاح. سيتم تحديث القائمة بعد إعادة تحميل الصفحة.");
    setForm({ ...form, project_no: "", name_ar: "", new_region_code: "" });
    setSaving(false);
    window.location.reload();
  }

  return (
    <section className="module-panel">
      <div className="section-title-row">
        <div>
          <h3>مناطق مشاريع الكهرباء</h3>
          <p>تظهر هنا المناطق المرتبطة فقط بمشاريع الكهرباء النشطة. إضافة مشروع بمنطقة جديدة تضيف المنطقة للشجرة.</p>
        </div>
        <button type="button" className="button" onClick={() => setShowForm((value) => !value)}>
          <Plus size={18} />
          إضافة مشروع كهرباء
        </button>
      </div>

      {showForm ? (
        <form className="electrical-project-form" onSubmit={submitProject}>
          <div className="field">
            <label htmlFor="company_id">الشركة *</label>
            <select
              id="company_id"
              value={form.company_id}
              onChange={(event) => setForm({ ...form, company_id: event.target.value })}
              required
            >
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name_ar}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="region_code">المنطقة *</label>
            <select
              id="region_code"
              value={form.region_code}
              onChange={(event) => setForm({ ...form, region_code: event.target.value })}
            >
              {knownRegions.map((region) => (
                <option key={region.code} value={region.code}>
                  {region.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="new_region_code">منطقة جديدة</label>
            <input
              id="new_region_code"
              value={form.new_region_code}
              onChange={(event) => setForm({ ...form, new_region_code: event.target.value })}
              placeholder="مثال: نجران أو north_area"
            />
          </div>
          <div className="field">
            <label htmlFor="project_no">رقم المشروع *</label>
            <input
              id="project_no"
              dir="ltr"
              value={form.project_no}
              onChange={(event) => setForm({ ...form, project_no: event.target.value })}
              required
            />
          </div>
          <div className="field permissions-wide-field">
            <label htmlFor="name_ar">اسم المشروع *</label>
            <input
              id="name_ar"
              value={form.name_ar}
              onChange={(event) => setForm({ ...form, name_ar: event.target.value })}
              required
            />
          </div>
          <div className="permissions-form-actions">
            <button type="submit" className="button" disabled={saving}>
              {saving ? "جاري الحفظ..." : "حفظ المشروع"}
            </button>
            <button type="button" className="secondary-button" onClick={() => setShowForm(false)}>
              إلغاء
            </button>
          </div>
        </form>
      ) : null}

      {error ? <div className="error">{error}</div> : null}
      {notice ? <div className="success-message">{notice}</div> : null}

      {regions.length ? (
        <div className="region-cards-grid">
          {regions.map((region) => (
            <article className="region-card" key={region.code}>
              <span>{region.count}</span>
              <h4>{region.name}</h4>
              <p>مشاريع كهرباء</p>
            </article>
          ))}
        </div>
      ) : (
        <p className="muted">لا توجد مناطق مرتبطة بمشاريع الكهرباء حاليا.</p>
      )}
    </section>
  );
}
