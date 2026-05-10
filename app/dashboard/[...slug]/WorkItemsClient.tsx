"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { Download, FileSpreadsheet, Pencil, PlusCircle, Save, Search, Trash2, UploadCloud, XCircle } from "lucide-react";
import * as XLSX from "xlsx";

type ContractOption = {
  id: string;
  contractNo: string;
  contractName: string;
  regionName: string;
  label: string;
};

type WorkItem = {
  id: string;
  contractId: string;
  itemNo: string;
  description: string;
  unit: string;
  unitPrice: number;
  contractPrice: number;
  active: boolean;
};

type PreviewItem = WorkItem & {
  status: "new" | "update" | "same" | "error";
  message: string;
};

type Notice = {
  type: "success" | "error";
  message: string;
};

type WorkItemsClientProps = {
  slug: string;
  homeSlug?: string;
  projectName: string;
  mode: "list" | "new" | "edit" | "import";
  selectedItemId?: string;
  contracts: ContractOption[];
};

type WorkItemFormState = {
  contractId: string;
  itemNo: string;
  description: string;
  unit: string;
  unitPrice: string;
  contractPrice: string;
  active: boolean;
};

const TEMPLATE_URL = "/templates/work-items.xlsx";

const headerAliases = {
  itemNo: ["item_no", "رقم البند", "Item"],
  description: ["description", "الوصف", "الوصف الكامل", "Long Description"],
  unit: ["unit", "الوحدة", "UOM"],
  unitPrice: ["unit_cost", "سعر الوحدة", "Unit Price"]
};

function normalizeHeader(value: string) {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/_/g, " ");
}

function pickCell(row: Record<string, unknown>, aliases: string[]) {
  const entries = Object.entries(row).map(([key, value]) => [normalizeHeader(key), value] as const);
  const normalizedAliases = aliases.map(normalizeHeader);
  const match = entries.find(([key]) => normalizedAliases.includes(key));
  return match?.[1] ?? "";
}

function toText(value: unknown) {
  return value === null || value === undefined ? "" : String(value).trim();
}

function toNumber(value: unknown) {
  const text = toText(value).replace(/,/g, "");
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function newId(prefix = "item") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(value);
}

function getStorageKey(slug: string) {
  return `bdcc-work-items:${slug}`;
}

function emptyForm(contractId: string): WorkItemFormState {
  return {
    contractId,
    itemNo: "",
    description: "",
    unit: "",
    unitPrice: "0",
    contractPrice: "0",
    active: true
  };
}

export default function WorkItemsClient({ slug, homeSlug, projectName, mode, selectedItemId, contracts }: WorkItemsClientProps) {
  const router = useRouter();
  const storageKey = useMemo(() => getStorageKey(slug), [slug]);
  const defaultContractId = contracts[0]?.id ?? "default-contract";
  const [items, setItems] = useState<WorkItem[]>([]);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [selectedContractId, setSelectedContractId] = useState(defaultContractId);
  const [searchText, setSearchText] = useState("");
  const [form, setForm] = useState<WorkItemFormState>(() => emptyForm(defaultContractId));
  const [previewRows, setPreviewRows] = useState<PreviewItem[]>([]);
  const [importContractId, setImportContractId] = useState(defaultContractId);
  const selectedItem = useMemo(() => items.find((item) => item.id === selectedItemId), [items, selectedItemId]);

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    if (stored) {
      try {
        setItems(JSON.parse(stored) as WorkItem[]);
      } catch {
        setItems([]);
      }
    }
  }, [storageKey]);

  useEffect(() => {
    setForm(
      selectedItem
        ? {
            contractId: selectedItem.contractId,
            itemNo: selectedItem.itemNo,
            description: selectedItem.description,
            unit: selectedItem.unit,
            unitPrice: String(selectedItem.unitPrice),
            contractPrice: String(selectedItem.contractPrice),
            active: selectedItem.active
          }
        : emptyForm(defaultContractId)
    );
  }, [defaultContractId, selectedItem]);

  function persist(nextItems: WorkItem[]) {
    setItems(nextItems);
    window.localStorage.setItem(storageKey, JSON.stringify(nextItems));
  }

  function showNotice(nextNotice: Notice) {
    setNotice(nextNotice);
    window.setTimeout(() => setNotice(null), 2600);
  }

  function backToList() {
    router.push(`/dashboard/${slug}`);
  }

  function redirectAfterSave() {
    window.setTimeout(backToList, 700);
  }

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const itemNo = form.itemNo.trim();
    const description = form.description.trim();
    const unit = form.unit.trim();
    const unitPrice = Number(form.unitPrice);
    const contractPrice = Number(form.contractPrice || form.unitPrice);

    if (!form.contractId || !itemNo || !description || !unit || !Number.isFinite(unitPrice)) {
      showNotice({ type: "error", message: "يرجى تعبئة بيانات البند المطلوبة." });
      return;
    }

    const duplicate = items.some((item) => item.contractId === form.contractId && item.itemNo === itemNo && item.id !== selectedItem?.id);
    if (duplicate) {
      showNotice({ type: "error", message: "رقم البند موجود بالفعل داخل العقد المحدد." });
      return;
    }

    const nextItem: WorkItem = {
      id: selectedItem?.id ?? newId("work-item"),
      contractId: form.contractId,
      itemNo,
      description,
      unit,
      unitPrice,
      contractPrice: Number.isFinite(contractPrice) ? contractPrice : unitPrice,
      active: form.active
    };

    const nextItems = selectedItem ? items.map((item) => (item.id === selectedItem.id ? nextItem : item)) : [...items, nextItem];
    persist(nextItems);
    showNotice({ type: "success", message: "تم الحفظ." });
    redirectAfterSave();
  }

  function handleDelete(itemId: string) {
    persist(items.filter((item) => item.id !== itemId));
    showNotice({ type: "success", message: "تم حفظ التغييرات." });
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
      const nextPreview = rows
        .map((row): PreviewItem => {
          const itemNo = toText(pickCell(row, headerAliases.itemNo));
          const description = toText(pickCell(row, headerAliases.description));
          const unit = toText(pickCell(row, headerAliases.unit));
          const rawUnitPrice = pickCell(row, headerAliases.unitPrice);
          const unitPriceText = toText(rawUnitPrice);
          const unitPrice = toNumber(rawUnitPrice);
          const existing = items.find((item) => item.contractId === importContractId && item.itemNo === itemNo);
          const base: WorkItem = {
            id: existing?.id ?? newId("preview"),
            contractId: importContractId,
            itemNo,
            description,
            unit,
            unitPrice,
            contractPrice: existing?.contractPrice ?? unitPrice,
            active: existing?.active ?? true
          };

          if (!itemNo || !description || !unit || !unitPriceText || !Number.isFinite(unitPrice)) {
            return { ...base, status: "error", message: "بيانات ناقصة أو سعر غير صحيح" };
          }

          if (!existing) return { ...base, status: "new", message: "بند جديد تماما" };

          const unchanged =
            existing.description === description &&
            existing.unit === unit &&
            existing.unitPrice === unitPrice &&
            existing.contractPrice === base.contractPrice;

          return { ...base, status: unchanged ? "same" : "update", message: unchanged ? "بدون تغيير" : "تحديث بيانات" };
        })
        .filter((row) => row.itemNo || row.description || row.unit);

      if (!nextPreview.length) {
        showNotice({ type: "error", message: "لم يتم العثور على بنود صالحة داخل الملف." });
        return;
      }

      setPreviewRows(nextPreview);
      showNotice({ type: "success", message: "تمت قراءة الملف. راجع البيانات قبل الحفظ." });
    } catch {
      showNotice({ type: "error", message: "تعذر قراءة ملف Excel. تأكد من استخدام القالب الصحيح." });
    }
  }

  function confirmImport() {
    const validRows = previewRows.filter((row) => row.status !== "error" && row.status !== "same");
    const nextItems = [...items];

    for (const row of validRows) {
      const index = nextItems.findIndex((item) => item.contractId === row.contractId && item.itemNo === row.itemNo);
      const cleanRow: WorkItem = {
        id: index >= 0 ? nextItems[index].id : newId("work-item"),
        contractId: row.contractId,
        itemNo: row.itemNo,
        description: row.description,
        unit: row.unit,
        unitPrice: row.unitPrice,
        contractPrice: row.contractPrice,
        active: row.active
      };
      if (index >= 0) nextItems[index] = cleanRow;
      else nextItems.push(cleanRow);
    }

    persist(nextItems);
    setPreviewRows([]);
    showNotice({ type: "success", message: "تم حفظ التغييرات." });
    redirectAfterSave();
  }

  const filteredItems = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return items.filter((item) => {
      const sameContract = selectedContractId === "all" || item.contractId === selectedContractId;
      const matchesQuery = !query || item.itemNo.toLowerCase().includes(query) || item.description.toLowerCase().includes(query);
      return sameContract && matchesQuery;
    });
  }, [items, searchText, selectedContractId]);

  const previewSummary = useMemo(
    () => ({
      new: previewRows.filter((row) => row.status === "new").length,
      update: previewRows.filter((row) => row.status === "update").length,
      same: previewRows.filter((row) => row.status === "same").length,
      error: previewRows.filter((row) => row.status === "error").length
    }),
    [previewRows]
  );

  if (mode === "new" || mode === "edit") {
    return (
      <section className="work-items-page">
        <PageNotice notice={notice} />
        <header className="work-items-header">
          <p>بنود الأعمال</p>
          <h2>{mode === "edit" ? "تعديل بند عمل" : "إضافة بند عمل"}</h2>
          <span>{projectName}</span>
        </header>
        <Link className="work-items-secondary-button work-items-back" href={`/dashboard/${slug}`}>
          رجوع
        </Link>
        <form className="work-item-form-card" onSubmit={handleSave}>
          <div className="work-item-form-grid">
            <Field label="العقد (المشروع) *">
              <select value={form.contractId} onChange={(event) => setForm((current) => ({ ...current, contractId: event.target.value }))}>
                <option value="">اختر العقد...</option>
                {contracts.map((contract) => (
                  <option key={contract.id} value={contract.id}>
                    {contract.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="رقم البند">
              <input value={form.itemNo} onChange={(event) => setForm((current) => ({ ...current, itemNo: event.target.value }))} />
            </Field>
            <Field label="الوحدة">
              <input value={form.unit} onChange={(event) => setForm((current) => ({ ...current, unit: event.target.value }))} placeholder="EA, KM, M..." />
            </Field>
            <Field label="سعر الوحدة">
              <input
                type="number"
                min="0"
                step="0.001"
                value={form.unitPrice}
                onChange={(event) => setForm((current) => ({ ...current, unitPrice: event.target.value, contractPrice: event.target.value }))}
              />
            </Field>
            <Field label="الوصف" full>
              <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows={5} />
            </Field>
            <label className="work-item-check">
              <input type="checkbox" checked={form.active} onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))} />
              نشط
            </label>
            <div className="work-item-form-actions">
              <button className="work-items-primary-button" type="submit">
                <Save size={18} />
                حفظ
              </button>
              <Link className="work-items-cancel-button" href={`/dashboard/${slug}`}>
                <XCircle size={18} />
                إلغاء
              </Link>
            </div>
          </div>
        </form>
      </section>
    );
  }

  if (mode === "import") {
    return (
      <section className="work-items-page">
        <PageNotice notice={notice} />
        <header className="work-items-header">
          <p>بنود الأعمال</p>
          <h2>{previewRows.length ? "معاينة الاستيراد" : "استيراد بنود الأعمال"}</h2>
          <span>{projectName}</span>
        </header>
        {!previewRows.length ? (
          <section className="work-items-import-card">
            <h3>
              <FileSpreadsheet size={24} />
              استيراد بنود الأعمال من ملف إكسل
            </h3>
            <div className="work-items-import-help">
              <h4>تعليمات مهمة للملف:</h4>
              <p>يجب أن يحتوي ملف الإكسل على الأعمدة التالية أو مسمياتها المقترحة.</p>
              <table>
                <thead>
                  <tr>
                    <th>المعلومة المطلوبة</th>
                    <th>المسميات المقبولة</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>رقم البند</td>
                    <td>item_no أو رقم البند أو Item</td>
                  </tr>
                  <tr>
                    <td>الوصف</td>
                    <td>description أو الوصف الكامل أو Long Description</td>
                  </tr>
                  <tr>
                    <td>سعر الوحدة</td>
                    <td>unit_cost أو سعر الوحدة أو Unit Price</td>
                  </tr>
                  <tr>
                    <td>الوحدة</td>
                    <td>unit أو الوحدة أو UOM</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="work-item-form-grid">
              <Field label="العقد (المشروع) *" full>
                <select value={importContractId} onChange={(event) => setImportContractId(event.target.value)}>
                  <option value="">اختر العقد...</option>
                  {contracts.map((contract) => (
                    <option key={contract.id} value={contract.id}>
                      {contract.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="ملف الإكسل *" full>
                <input type="file" accept=".xlsx,.xls" onChange={handleFileChange} />
              </Field>
            </div>
            <div className="work-item-form-actions">
              <a className="work-items-secondary-button" href={TEMPLATE_URL} download>
                <Download size={18} />
                تنزيل قالب إكسل
              </a>
              <Link className="work-items-cancel-button" href={`/dashboard/${slug}`}>
                <XCircle size={18} />
                إلغاء
              </Link>
            </div>
          </section>
        ) : (
          <section className="work-items-preview-card">
            <div className="work-items-preview-note">
              <h3>معاينة البيانات قبل الحفظ</h3>
              <p>سيتم تحديث وصف البنود وأسعار العقد المختار أو إضافتها حسب المعاينة أدناه.</p>
            </div>
            <WorkItemsPreviewTable rows={previewRows} />
            <div className="work-items-preview-footer">
              <span className="summary-new">جديد: {previewSummary.new}</span>
              <span className="summary-update">تحديث: {previewSummary.update}</span>
              <span className="summary-same">بدون تغيير: {previewSummary.same}</span>
              <span className="summary-error">خطأ: {previewSummary.error}</span>
            </div>
            <div className="work-item-form-actions">
              <button className="work-items-primary-button" type="button" onClick={confirmImport} disabled={previewSummary.error > 0}>
                <UploadCloud size={18} />
                تأكيد وحفظ التغييرات
              </button>
              <button className="work-items-cancel-button" type="button" onClick={() => setPreviewRows([])}>
                <XCircle size={18} />
                إلغاء
              </button>
            </div>
          </section>
        )}
      </section>
    );
  }

  return (
    <section className="work-items-page">
      <PageNotice notice={notice} />
      <header className="work-items-header">
        <p>لوحة التحكم</p>
        <h2>بنود الأعمال</h2>
        <span>{projectName}</span>
      </header>
      <div className="work-items-toolbar">
        <Link className="work-items-primary-button" href={`/dashboard/${slug}?mode=new`}>
          <PlusCircle size={18} />
          إضافة بند
        </Link>
        <Link className="work-items-primary-button" href={`/dashboard/${slug}?mode=import`}>
          <FileSpreadsheet size={18} />
          استيراد من إكسل
        </Link>
      </div>
      <div className="work-items-filters">
        <select value={selectedContractId} onChange={(event) => setSelectedContractId(event.target.value)}>
          <option value="all">جميع العقود (السعر الافتراضي)</option>
          {contracts.map((contract) => (
            <option key={contract.id} value={contract.id}>
              {contract.label}
            </option>
          ))}
        </select>
        <input value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="بحث برقم/وصف البند" />
        <button type="button" className="work-items-search-button">
          <Search size={16} />
          بحث
        </button>
      </div>
      <section className="work-items-card">
        <div className="work-items-table">
          <div className="work-items-table-head">
            <span>م</span>
            <span>رقم البند</span>
            <span>الوصف</span>
            <span>الوحدة</span>
            <span>سعر الوحدة</span>
            <span>سعر العقد</span>
            <span>نشط</span>
            <span>إجراءات</span>
          </div>
          {filteredItems.length ? (
            filteredItems.map((item, index) => (
              <div className="work-items-table-row" key={item.id}>
                <span>{index + 1}</span>
                <span className="work-item-number">{item.itemNo}</span>
                <span className="work-item-description">{item.description}</span>
                <span>{item.unit}</span>
                <span>{formatMoney(item.unitPrice)}</span>
                <span>{formatMoney(item.contractPrice)}</span>
                <span>
                  <em className={item.active ? "work-item-active" : "work-item-inactive"}>{item.active ? "نعم" : "لا"}</em>
                </span>
                <span className="work-item-actions">
                  <Link className="work-item-edit" href={`/dashboard/${slug}?mode=edit&item=${item.id}`}>
                    <Pencil size={15} />
                    تعديل
                  </Link>
                  <button className="work-item-delete" type="button" onClick={() => handleDelete(item.id)}>
                    <Trash2 size={15} />
                    حذف
                  </button>
                </span>
              </div>
            ))
          ) : (
            <div className="work-items-empty">لا توجد بيانات</div>
          )}
        </div>
      </section>
    </section>
  );
}

function Field({ label, full, children }: { label: string; full?: boolean; children: ReactNode }) {
  return (
    <label className={full ? "work-item-field work-item-field-full" : "work-item-field"}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function PageNotice({ notice }: { notice: Notice | null }) {
  if (!notice) return null;
  return <div className={notice.type === "success" ? "work-items-notice success" : "work-items-notice error"}>{notice.message}</div>;
}

function WorkItemsPreviewTable({ rows }: { rows: PreviewItem[] }) {
  return (
    <div className="work-items-preview-table">
      <div className="work-items-preview-head">
        <span>الحالة</span>
        <span>رقم البند</span>
        <span>الوصف</span>
        <span>الوحدة</span>
        <span>السعر</span>
        <span>ملاحظات</span>
      </div>
      {rows.map((row) => (
        <div className="work-items-preview-row" key={`${row.contractId}-${row.itemNo}-${row.id}`}>
          <span>
            <em className={`preview-${row.status}`}>
              {row.status === "new" ? "جديد" : row.status === "update" ? "تحديث" : row.status === "same" ? "بدون تغيير" : "خطأ"}
            </em>
          </span>
          <span className="work-item-number">{row.itemNo || "-"}</span>
          <span className="work-item-description">{row.description || "-"}</span>
          <span>{row.unit || "-"}</span>
          <span>{row.unitPrice ? formatMoney(row.unitPrice) : "-"}</span>
          <span>{row.message}</span>
        </div>
      ))}
    </div>
  );
}
