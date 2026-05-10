"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { CheckCircle2, LockKeyhole, Pencil, PlusCircle, Save, ShieldCheck, Trash2, XCircle } from "lucide-react";

type WorkCodeType = "system" | "normal";

type WorkCode = {
  code: string;
  description: string;
  type: WorkCodeType;
  protected: boolean;
};

type Notice = {
  type: "success" | "error";
  message: string;
};

type WorkDescriptionCodesClientProps = {
  slug: string;
  homeSlug?: string;
  projectName: string;
  mode: "list" | "new" | "edit";
  selectedCode?: string;
};

const initialWorkCodes: WorkCode[] = [
  { code: "EMERGENCY", description: "طوارئ", type: "system", protected: true },
  { code: "GENERAL", description: "عام", type: "system", protected: true },
  { code: "COMPANY", description: "شركة", type: "system", protected: true },
  { code: "CONTRACTOR", description: "مقاول", type: "system", protected: true },
  { code: "404", description: "توصيل عداد بمحطة شبكة أرضية", type: "normal", protected: false },
  { code: "405", description: "توصيل عداد بمحطة شبكة هوائية", type: "normal", protected: false },
  { code: "410", description: "إنشاء محطة / محول لمشترك", type: "normal", protected: false },
  { code: "430", description: "كهربة ربط المخططات", type: "normal", protected: false },
  { code: "432", description: "أتمتة شبكة", type: "normal", protected: false },
  { code: "441", description: "تعزيز شبكة أرضية ومحطات", type: "normal", protected: false },
  { code: "442", description: "تعزيز شبكة هوائية ومحولات", type: "normal", protected: false },
  { code: "443", description: "المغذيات الشعاعية", type: "normal", protected: false },
  { code: "444", description: "تحويل شبكة من هوائي إلى أرضي", type: "normal", protected: false },
  { code: "450", description: "مشاريع ربط محطات التحويل", type: "normal", protected: false },
  { code: "451", description: "ربط المناطق المعزولة", type: "normal", protected: false }
];

function typeLabel(type: WorkCodeType) {
  return type === "system" ? "كود نظام" : "كود عادي";
}

export default function WorkDescriptionCodesClient({
  slug,
  homeSlug,
  projectName,
  mode,
  selectedCode
}: WorkDescriptionCodesClientProps) {
  const router = useRouter();
  const [codes, setCodes] = useState(initialWorkCodes);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [saving, setSaving] = useState(false);

  const storageKey = useMemo(() => `bdcc-work-description-codes:${slug}`, [slug]);
  const activeCode = useMemo(() => codes.find((code) => code.code === selectedCode), [codes, selectedCode]);
  const editableCode = activeCode ?? codes.find((code) => !code.protected) ?? initialWorkCodes[4];

  useEffect(() => {
    try {
      const storedCodes = window.localStorage.getItem(storageKey);
      if (!storedCodes) return;
      const parsedCodes = JSON.parse(storedCodes) as WorkCode[];
      if (Array.isArray(parsedCodes) && parsedCodes.length) {
        setCodes(parsedCodes);
      }
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  function commitCodes(nextCodes: WorkCode[]) {
    setCodes(nextCodes);
    window.localStorage.setItem(storageKey, JSON.stringify(nextCodes));
  }

  function returnToProjectHome() {
    if (!homeSlug) return;
    window.setTimeout(() => router.push(`/dashboard/${homeSlug}`), 1050);
  }

  function saveCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);

    const formData = new FormData(event.currentTarget);
    const code = String(formData.get("code") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();

    if (!code || !description) {
      setNotice({ type: "error", message: "يرجى تعبئة الكود والوصف." });
      return;
    }

    if (mode === "new" && codes.some((item) => item.code.toLowerCase() === code.toLowerCase())) {
      setNotice({ type: "error", message: "هذا الكود موجود مسبقًا." });
      return;
    }

    setSaving(true);
    window.setTimeout(() => {
      const nextCodes =
        mode === "edit"
          ? codes.map((item) => (item.code === editableCode.code ? { ...item, code, description } : item))
          : [...codes, { code, description, type: "normal" as const, protected: false }];
      commitCodes(nextCodes);
      setSaving(false);
      setNotice({ type: "success", message: "تم حفظ التغييرات" });
      returnToProjectHome();
    }, 300);
  }

  function deleteCode(code: string) {
    commitCodes(codes.filter((item) => item.code !== code));
    setNotice({ type: "success", message: "تم حفظ التغييرات" });
    returnToProjectHome();
  }

  if (mode === "new" || mode === "edit") {
    const formTitle = mode === "edit" ? "تعديل كود وصف عمل" : "إضافة كود وصف عمل";
    const submitLabel = mode === "edit" ? "حفظ التعديلات" : "حفظ";

    return (
      <section className="work-codes-page" aria-label={formTitle}>
        {notice ? (
          <div className={`profile-toast profile-toast-${notice.type}`} role="status">
            {notice.type === "success" ? <CheckCircle2 size={54} /> : null}
            <strong>{notice.message}</strong>
          </div>
        ) : null}

        <header className="work-codes-header">
          <div>
            <p>إعداد أكواد وصف العمل للمشروع الحالي</p>
            <h2>{formTitle}</h2>
            <span>{projectName}</span>
          </div>
        </header>

        <div className="work-codes-toolbar">
          <Link href={`/dashboard/${slug}`} className="work-codes-secondary-button">
            رجوع
          </Link>
        </div>

        <section className="work-code-form-card">
          <form className="work-code-form-grid" onSubmit={saveCode}>
            <div className="work-code-field">
              <label htmlFor="workCodeValue">الكود *</label>
              <input
                id="workCodeValue"
                name="code"
                dir="ltr"
                defaultValue={mode === "edit" ? editableCode.code : ""}
                placeholder="مثال: 423"
                readOnly={mode === "edit" && editableCode.protected}
              />
            </div>

            <div className="work-code-field">
              <label htmlFor="workCodeDescription">الوصف *</label>
              <input
                id="workCodeDescription"
                name="description"
                defaultValue={mode === "edit" ? editableCode.description : ""}
                placeholder="مثال: تركيب عدادات"
              />
            </div>

            <div className="work-code-form-actions">
              <Link href={`/dashboard/${slug}`} className="work-codes-cancel-button">
                <XCircle size={18} />
                إلغاء
              </Link>
              <button type="submit" className="work-codes-primary-button" disabled={saving}>
                <Save size={18} />
                {saving ? "جاري الحفظ..." : submitLabel}
              </button>
            </div>
          </form>
        </section>
      </section>
    );
  }

  return (
    <section className="work-codes-page" aria-label="أكواد وصف العمل">
      {notice ? (
        <div className={`profile-toast profile-toast-${notice.type}`} role="status">
          {notice.type === "success" ? <CheckCircle2 size={54} /> : null}
          <strong>{notice.message}</strong>
        </div>
      ) : null}

      <header className="work-codes-header">
        <div>
          <p>القائمة التشغيلية الخاصة بالمشروع الحالي</p>
          <h2>أكواد وصف العمل</h2>
          <span>{projectName}</span>
        </div>
      </header>

      <div className="work-codes-toolbar">
        <Link href={`/dashboard/${slug}?mode=new`} className="work-codes-primary-button">
          <PlusCircle size={18} />
          إضافة كود
        </Link>
      </div>

      <section className="work-codes-card">
        <div className="work-codes-table" role="table" aria-label="أكواد وصف العمل">
          <div className="work-codes-table-head" role="row">
            <span role="columnheader">#</span>
            <span role="columnheader">الكود</span>
            <span role="columnheader">الوصف</span>
            <span role="columnheader">النوع</span>
            <span role="columnheader">إجراءات</span>
          </div>

          {codes.map((workCode, index) => (
            <div className="work-codes-table-row" role="row" key={workCode.code}>
              <span role="cell">{index + 1}</span>
              <span role="cell" className="work-code-value">
                {workCode.protected ? <ShieldCheck size={16} /> : null}
                {workCode.code}
              </span>
              <span role="cell" className="work-code-description">
                {workCode.description}
              </span>
              <span role="cell">
                <i className={`work-code-badge work-code-badge-${workCode.type}`}>{typeLabel(workCode.type)}</i>
              </span>
              <span role="cell">
                {workCode.protected ? (
                  <span className="work-code-protected">
                    <LockKeyhole size={16} />
                    محمي
                  </span>
                ) : (
                  <div className="work-code-actions">
                    <Link
                      href={`/dashboard/${slug}?mode=edit&code=${encodeURIComponent(workCode.code)}`}
                      className="work-code-edit"
                      aria-label={`تعديل ${workCode.description}`}
                    >
                      <Pencil size={16} />
                      تعديل
                    </Link>
                    <button type="button" className="work-code-delete" onClick={() => deleteCode(workCode.code)}>
                      <Trash2 size={16} />
                      حذف
                    </button>
                  </div>
                )}
              </span>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
