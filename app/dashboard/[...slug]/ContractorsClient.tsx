"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { CheckCircle2, Home, PlusCircle, Save, Users, XCircle } from "lucide-react";

type RegionOption = {
  code: string;
  name: string;
};

type ContractorsClientProps = {
  slug: string;
  homeSlug?: string;
  projectName: string;
  regions: RegionOption[];
  mode: "list" | "new";
};

type Notice = {
  type: "success" | "error";
  message: string;
};

export default function ContractorsClient({ slug, homeSlug, projectName, regions, mode }: ContractorsClientProps) {
  const router = useRouter();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState("");

  const contractorCode = useMemo(() => "C-0001", []);

  function returnToHome() {
    if (!homeSlug) return;
    window.setTimeout(() => router.push(`/dashboard/${homeSlug}`), 1100);
  }

  function saveContractor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const region = String(formData.get("region") ?? "").trim();

    if (!name || !region) {
      setNotice({ type: "error", message: "يرجى تعبئة اسم المقاول واختيار المنطقة." });
      return;
    }

    setSaving(true);
    window.setTimeout(() => {
      setSaving(false);
      setNotice({ type: "success", message: "تم حفظ التغييرات" });
      returnToHome();
    }, 350);
  }

  if (mode === "new") {
    return (
      <section className="contractors-page" aria-label="إضافة مقاول جديد">
        {notice ? (
          <div className={`profile-toast profile-toast-${notice.type}`} role="status">
            {notice.type === "success" ? <CheckCircle2 size={54} /> : null}
            <strong>{notice.message}</strong>
          </div>
        ) : null}

        <header className="contractors-header">
          <div>
            <p>إضافة مقاول للمشروع الحالي</p>
            <h2>إضافة مقاول جديد</h2>
            <span>{projectName}</span>
          </div>
        </header>

        <div className="contractors-toolbar">
          <Link href={`/dashboard/${slug}`} className="contractors-secondary-button">
            رجوع
          </Link>
        </div>

        <section className="contractors-form-card">
          <form className="contractors-form-grid" onSubmit={saveContractor}>
            <div className="contractors-field">
              <label htmlFor="contractorCode">كود المقاول</label>
              <input id="contractorCode" name="code" value={contractorCode} readOnly />
              <small>سيتم توليد الكود تلقائياً</small>
            </div>

            <div className="contractors-field">
              <label htmlFor="contractorRegion">المنطقة *</label>
              <select
                id="contractorRegion"
                name="region"
                value={selectedRegion}
                onChange={(event) => setSelectedRegion(event.target.value)}
              >
                <option value="">اختر المنطقة</option>
                {regions.map((region) => (
                  <option value={region.code} key={region.code}>
                    {region.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="contractors-field">
              <label htmlFor="contractorName">الاسم *</label>
              <input id="contractorName" name="name" />
            </div>

            <div className="contractors-field">
              <label htmlFor="contractorCompany">اسم الشركة</label>
              <input id="contractorCompany" name="company" />
            </div>

            <div className="contractors-field">
              <label htmlFor="contractorPhone">رقم الهاتف</label>
              <input id="contractorPhone" name="phone" dir="ltr" />
            </div>

            <div className="contractors-field">
              <label htmlFor="contractorEmail">البريد الإلكتروني</label>
              <input id="contractorEmail" name="email" type="email" dir="ltr" />
            </div>

            <div className="contractors-field contractors-field-full">
              <label htmlFor="contractorNotes">ملاحظات</label>
              <textarea id="contractorNotes" name="notes" rows={5} />
            </div>

            <div className="contractors-actions">
              <Link href={`/dashboard/${slug}`} className="contractors-cancel-button">
                <XCircle size={18} />
                إلغاء
              </Link>
              <button type="submit" className="contractors-primary-button" disabled={saving}>
                <Save size={18} />
                {saving ? "جاري الحفظ..." : "حفظ"}
              </button>
            </div>
          </form>
        </section>
      </section>
    );
  }

  return (
    <section className="contractors-page" aria-label="المقاولين">
      <header className="contractors-header">
        <div>
          <p>إدارة المقاولين الخاصة بالمشروع الحالي</p>
          <h2>المقاولين</h2>
          <span>{projectName}</span>
        </div>
      </header>

      <div className="contractors-toolbar">
        <Link href={`/dashboard/${slug}?mode=new`} className="contractors-primary-button">
          <PlusCircle size={18} />
          إضافة مقاول جديد
        </Link>
        {homeSlug ? (
          <Link href={`/dashboard/${homeSlug}`} className="contractors-secondary-button">
            <Home size={18} />
            القائمة الرئيسية
          </Link>
        ) : null}
      </div>

      <section className="contractors-empty-card">
        <Users size={64} />
        <h3>لا يوجد مقاولين مسجلين</h3>
        <Link href={`/dashboard/${slug}?mode=new`} className="contractors-primary-button">
          <PlusCircle size={18} />
          إضافة مقاول جديد
        </Link>
      </section>
    </section>
  );
}
