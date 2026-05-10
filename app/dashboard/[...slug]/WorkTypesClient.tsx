"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Pencil, PlusCircle, Save, Trash2, XCircle } from "lucide-react";

type WorkType = {
  id: string;
  name: string;
  description: string;
  masterPath: string;
  exceptionPath: string;
  exceptionCodes: string;
  active: boolean;
};

type Notice = {
  type: "success" | "error";
  message: string;
};

type WorkTypesClientProps = {
  slug: string;
  homeSlug?: string;
  projectName: string;
  mode: "list" | "new" | "edit";
  selectedType?: string;
};

const MASTER_PATH = "المسار الأساسي (Standard)";
const EXCEPTION_PATH = "مسار استثنائي";

const initialWorkTypes: WorkType[] = [
  {
    id: "connections",
    name: "التوصيلات",
    description: "أعمال التوصيلات الكهربائية",
    masterPath: MASTER_PATH,
    exceptionPath: EXCEPTION_PATH,
    exceptionCodes: "801-409",
    active: true
  },
  {
    id: "connection-projects",
    name: "مشاريع التوصيلات",
    description: "مشاريع التوصيلات",
    masterPath: MASTER_PATH,
    exceptionPath: "-",
    exceptionCodes: "-",
    active: true
  },
  {
    id: "projects",
    name: "المشاريع",
    description: "أعمال المشاريع",
    masterPath: MASTER_PATH,
    exceptionPath: "-",
    exceptionCodes: "-",
    active: true
  },
  {
    id: "maintenance",
    name: "الصيانة والفحص",
    description: "أعمال الصيانة والفحص",
    masterPath: MASTER_PATH,
    exceptionPath: "-",
    exceptionCodes: "-",
    active: true
  },
  {
    id: "emergency",
    name: "الطوارئ",
    description: "أعمال الطوارئ",
    masterPath: MASTER_PATH,
    exceptionPath: "-",
    exceptionCodes: "-",
    active: true
  }
];

function makeWorkTypeId(name: string) {
  const normalized = name.trim().toLowerCase().replace(/\s+/g, "-");
  return normalized || `work-type-${Date.now()}`;
}

export default function WorkTypesClient({ slug, homeSlug, projectName, mode, selectedType }: WorkTypesClientProps) {
  const router = useRouter();
  const [workTypes, setWorkTypes] = useState(initialWorkTypes);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [saving, setSaving] = useState(false);

  const storageKey = useMemo(() => `bdcc-work-types:${slug}`, [slug]);
  const activeType = useMemo(() => workTypes.find((item) => item.id === selectedType), [workTypes, selectedType]);
  const editableType = activeType ?? workTypes[0];

  useEffect(() => {
    try {
      const storedTypes = window.localStorage.getItem(storageKey);
      if (!storedTypes) return;
      const parsedTypes = JSON.parse(storedTypes) as WorkType[];
      if (Array.isArray(parsedTypes) && parsedTypes.length) {
        setWorkTypes(parsedTypes);
      }
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  function commitWorkTypes(nextTypes: WorkType[]) {
    setWorkTypes(nextTypes);
    window.localStorage.setItem(storageKey, JSON.stringify(nextTypes));
  }

  function returnToProjectHome() {
    if (!homeSlug) return;
    window.setTimeout(() => router.push(`/dashboard/${homeSlug}`), 1050);
  }

  function saveWorkType(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const masterPath = String(formData.get("masterPath") ?? "").trim();
    const exceptionPath = String(formData.get("exceptionPath") ?? "").trim();
    const exceptionCodes = String(formData.get("exceptionCodes") ?? "").trim();
    const active = formData.get("active") === "on";

    if (!name || !masterPath) {
      setNotice({ type: "error", message: "يرجى تعبئة اسم نوع العمل والمسار الأساسي." });
      return;
    }

    setSaving(true);
    window.setTimeout(() => {
      const nextItem: WorkType = {
        id: mode === "edit" ? editableType.id : makeWorkTypeId(name),
        name,
        description,
        masterPath,
        exceptionPath: exceptionPath || "-",
        exceptionCodes: exceptionCodes || "-",
        active
      };
      const nextTypes =
        mode === "edit"
          ? workTypes.map((item) => (item.id === editableType.id ? nextItem : item))
          : [...workTypes, nextItem];

      commitWorkTypes(nextTypes);
      setSaving(false);
      setNotice({ type: "success", message: "تم حفظ التغييرات" });
      returnToProjectHome();
    }, 300);
  }

  function deleteWorkType(id: string) {
    commitWorkTypes(workTypes.filter((item) => item.id !== id));
    setNotice({ type: "success", message: "تم حفظ التغييرات" });
    returnToProjectHome();
  }

  if (mode === "new" || mode === "edit") {
    const formTitle = mode === "edit" ? "تعديل نوع عمل" : "إضافة نوع عمل";
    const submitLabel = mode === "edit" ? "حفظ التعديلات" : "حفظ";

    return (
      <section className="work-types-page" aria-label={formTitle}>
        {notice ? (
          <div className={`profile-toast profile-toast-${notice.type}`} role="status">
            {notice.type === "success" ? <CheckCircle2 size={54} /> : null}
            <strong>{notice.message}</strong>
          </div>
        ) : null}

        <header className="work-types-header">
          <div>
            <p>إعداد أنواع العمل للمشروع الحالي</p>
            <h2>{formTitle}</h2>
            <span>{projectName}</span>
          </div>
        </header>

        <div className="work-types-toolbar">
          <Link href={`/dashboard/${slug}`} className="work-types-secondary-button">
            رجوع
          </Link>
        </div>

        <section className="work-type-form-card">
          <form className="work-type-form-grid" onSubmit={saveWorkType}>
            <div className="work-type-field">
              <label htmlFor="workTypeName">اسم نوع العمل *</label>
              <input id="workTypeName" name="name" defaultValue={mode === "edit" ? editableType.name : ""} />
            </div>

            <div className="work-type-field">
              <label htmlFor="workTypeDescription">الوصف</label>
              <input
                id="workTypeDescription"
                name="description"
                defaultValue={mode === "edit" ? editableType.description : ""}
                placeholder="مثال: أعمال التوصيلات الكهربائية"
              />
            </div>

            <div className="work-type-dispatcher-title">
              <h3>إعدادات الموزع الذكي (Workflow Dispatcher)</h3>
            </div>

            <div className="work-type-field">
              <label htmlFor="workTypeMasterPath">المسار الأساسي (Master Path)</label>
              <select id="workTypeMasterPath" name="masterPath" defaultValue={mode === "edit" ? editableType.masterPath : MASTER_PATH}>
                <option>{MASTER_PATH}</option>
              </select>
              <small>هذا المسار يتم اتباعه افتراضيا لجميع أوامر العمل من هذا النوع.</small>
            </div>

            <div className="work-type-field">
              <label htmlFor="workTypeExceptionPath">المسار الاستثنائي (Exception Path)</label>
              <select id="workTypeExceptionPath" name="exceptionPath" defaultValue={mode === "edit" ? editableType.exceptionPath : "-"}>
                <option>-</option>
                <option>{EXCEPTION_PATH}</option>
              </select>
              <small>يستخدم كمسار بديل عند تطابق أكواد وصف العمل المحددة أدناه.</small>
            </div>

            <div className="work-type-field work-type-field-full">
              <label htmlFor="workTypeExceptionCodes">أكواد وصف العمل المفعلة للاستثناء</label>
              <input
                id="workTypeExceptionCodes"
                name="exceptionCodes"
                dir="ltr"
                defaultValue={mode === "edit" ? editableType.exceptionCodes : ""}
                placeholder="مثال: 801-409"
              />
              <small>أدخل الأكواد مفصولة بعلامة - فقط. عند وجود الكود في أمر العمل يتم اختيار المسار الاستثنائي.</small>
            </div>

            <label className="work-type-active-toggle">
              <input type="checkbox" name="active" defaultChecked={mode === "edit" ? editableType.active : true} />
              <span>نشط</span>
            </label>

            <div className="work-type-form-actions">
              <Link href={`/dashboard/${slug}`} className="work-types-cancel-button">
                <XCircle size={18} />
                إلغاء
              </Link>
              <button type="submit" className="work-types-primary-button" disabled={saving}>
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
    <section className="work-types-page" aria-label="أنواع العمل">
      {notice ? (
        <div className={`profile-toast profile-toast-${notice.type}`} role="status">
          {notice.type === "success" ? <CheckCircle2 size={54} /> : null}
          <strong>{notice.message}</strong>
        </div>
      ) : null}

      <header className="work-types-header">
        <div>
          <p>القائمة التشغيلية الخاصة بالمشروع الحالي</p>
          <h2>أنواع العمل</h2>
          <span>{projectName}</span>
        </div>
      </header>

      <div className="work-types-toolbar">
        <Link href={`/dashboard/${slug}?mode=new`} className="work-types-primary-button">
          <PlusCircle size={18} />
          إضافة نوع عمل
        </Link>
      </div>

      <section className="work-types-card">
        <div className="work-types-table" role="table" aria-label="أنواع العمل">
          <div className="work-types-table-head" role="row">
            <span role="columnheader">#</span>
            <span role="columnheader">اسم نوع العمل</span>
            <span role="columnheader">المسار الأساسي</span>
            <span role="columnheader">المسار الاستثنائي</span>
            <span role="columnheader">أكواد الاستثناء</span>
            <span role="columnheader">نشط</span>
            <span role="columnheader">إجراءات</span>
          </div>

          {workTypes.map((workType, index) => (
            <div className="work-types-table-row" role="row" key={workType.id}>
              <span role="cell">{index + 1}</span>
              <span role="cell" className="work-type-name">
                {workType.name}
              </span>
              <span role="cell">{workType.masterPath}</span>
              <span role="cell">{workType.exceptionPath}</span>
              <span role="cell">
                <i className="work-type-code-pill">{workType.exceptionCodes}</i>
              </span>
              <span role="cell">
                <i className={workType.active ? "work-type-active-pill" : "work-type-inactive-pill"}>{workType.active ? "نعم" : "لا"}</i>
              </span>
              <span role="cell">
                <div className="work-type-actions">
                  <Link
                    href={`/dashboard/${slug}?mode=edit&type=${encodeURIComponent(workType.id)}`}
                    className="work-type-edit"
                    aria-label={`تعديل ${workType.name}`}
                  >
                    <Pencil size={16} />
                    تعديل
                  </Link>
                  <button type="button" className="work-type-delete" onClick={() => deleteWorkType(workType.id)}>
                    <Trash2 size={16} />
                    حذف
                  </button>
                </div>
              </span>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
