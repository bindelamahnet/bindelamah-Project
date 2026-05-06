"use client";

import { FormEvent, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { defaultCityForRegion } from "@/lib/erp/project-menu";

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
  { code: "riyadh", name: "الرياض" },
  { code: "makkah", name: "مكة المكرمة" },
  { code: "madinah", name: "المدينة المنورة" },
  { code: "eastern", name: "الشرقية" },
  { code: "aseer", name: "عسير" },
  { code: "qassim", name: "القصيم" },
  { code: "tabuk", name: "تبوك" },
  { code: "hail", name: "حائل" },
  { code: "jawf", name: "الجوف" },
  { code: "jazan", name: "جازان" },
  { code: "najran", name: "نجران" },
  { code: "baha", name: "الباحة" },
  { code: "northern_borders", name: "الحدود الشمالية" }
];

export default function ElectricalProjectsClient({ companies, regions }: { companies: Company[]; regions: RegionCard[] }) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({
    company_id: companies[0]?.id ?? "",
    project_no: "",
    name_ar: "",
    region_code: knownRegions[0].code,
    city_code: defaultCityForRegion(knownRegions[0].code).code
  });

  const selectedCity = useMemo(() => defaultCityForRegion(form.region_code), [form.region_code]);

  async function submitProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    const response = await fetch("/api/admin/electrical-projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, city_code: form.city_code || selectedCity.code })
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(data.error ?? "تعذر إضافة مشروع الكهرباء.");
      setSaving(false);
      return;
    }

    setNotice("تمت إضافة مشروع الكهرباء بنجاح. سيتم تحديث القائمة بعد إعادة تحميل الصفحة.");
    setForm({ ...form, project_no: "", name_ar: "", city_code: selectedCity.code });
    setSaving(false);
    window.location.reload();
  }

  return (
    <section className="module-panel">
      <div className="section-title-row">
        <div>
          <h3>مناطق مشاريع الكهرباء</h3>
          <p>تظهر هنا المناطق المرتبطة بمشاريع الكهرباء النشطة، وتظهر المشاريع داخل المدينة التابعة للمنطقة.</p>
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
              onChange={(event) => {
                const city = defaultCityForRegion(event.target.value);
                setForm({ ...form, region_code: event.target.value, city_code: city.code });
              }}
            >
              {knownRegions.map((region) => (
                <option key={region.code} value={region.code}>
                  {region.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="city_code">المدينة *</label>
            <input
              id="city_code"
              value={form.city_code}
              onChange={(event) => setForm({ ...form, city_code: event.target.value })}
              placeholder={selectedCity.name}
              required
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
            <input id="name_ar" value={form.name_ar} onChange={(event) => setForm({ ...form, name_ar: event.target.value })} required />
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
