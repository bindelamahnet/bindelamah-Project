"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  Home,
  PlusCircle,
  Printer,
  Save,
  Search,
  UploadCloud,
  XCircle
} from "lucide-react";

type ContractOption = {
  id: string;
  contractNo: string;
  contractName: string;
  regionName: string;
  label: string;
};

type WorkCode = {
  code: string;
  description: string;
};

type WorkType = {
  id: string;
  name: string;
  description: string;
};

type Notice = {
  type: "success" | "error";
  message: string;
};

type WorkOrderRecord = {
  id: string;
  workOrderNo: string;
  contractId: string;
  contractNo: string;
  contractName: string;
  regionName: string;
  cityName: string;
  neighborhood: string;
  workTypeId: string;
  workTypeName: string;
  workCode: string;
  workCodeDescription: string;
  workDescription: string;
  mobileNo: string;
  subscriberName: string;
  subscriberNo: string;
  transformerNo: string;
  address: string;
  latitude: string;
  longitude: string;
  estimatedCost: string;
  stationNo: string;
  approvalDate: string;
  expectedDurationDays: string;
  outageCapacity: string;
  noObjectionNo: string;
  executorName: string;
  notes: string;
  createdAt: string;
};

type WorkOrderFormState = {
  workOrderNo: string;
  contractId: string;
  regionName: string;
  cityName: string;
  neighborhood: string;
  workTypeId: string;
  workCode: string;
  workDescription: string;
  mobileNo: string;
  subscriberName: string;
  subscriberNo: string;
  transformerNo: string;
  address: string;
  latitude: string;
  longitude: string;
  estimatedCost: string;
  stationNo: string;
  approvalDate: string;
  expectedDurationDays: string;
  outageCapacity: string;
  noObjectionNo: string;
  executorName: string;
  notes: string;
};

type SecWorkOrderNewClientProps = {
  slug: string;
  homeSlug?: string;
  projectName: string;
  projectStorageKey: string;
  workOrderItemsSlug?: string;
  contracts: ContractOption[];
  workCodeStorageKey?: string;
  workTypeStorageKey?: string;
  fallbackRegionName: string;
  fallbackCityName: string;
};

type SecWorkOrderItemsClientProps = {
  slug: string;
  homeSlug?: string;
  projectName: string;
  projectStorageKey: string;
  selectedWorkOrderNo?: string;
  workItemsStorageKey?: string;
};

type WorkItemOption = {
  id: string;
  contractId: string;
  itemNo: string;
  description: string;
  unit: string;
  unitPrice: number;
  contractPrice?: number;
  active?: boolean;
};

type WorkOrderItemRecord = {
  id: string;
  itemNo: string;
  description: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  total: number;
  active: boolean;
  createdAt: string;
};

type WorkOrderItemPreview = WorkOrderItemRecord & {
  status: "new" | "update" | "same" | "error";
  message: string;
};

const initialWorkCodes: WorkCode[] = [
  { code: "EMERGENCY", description: "طوارئ" },
  { code: "GENERAL", description: "عام" },
  { code: "COMPANY", description: "شركة" },
  { code: "CONTRACTOR", description: "مقاول" },
  { code: "404", description: "توصيل عداد بمحطة شبكة أرضية" },
  { code: "405", description: "توصيل عداد بمحطة شبكة هوائية" },
  { code: "410", description: "إنشاء محطة / محول لمشترك" },
  { code: "430", description: "كهربة ربط المخططات" },
  { code: "432", description: "أتمتة شبكة" },
  { code: "441", description: "تعزيز شبكة أرضية ومحطات" },
  { code: "442", description: "تعزيز شبكة هوائية ومحولات" },
  { code: "443", description: "المغذيات الشعاعية" },
  { code: "444", description: "تحويل شبكة من هوائي إلى أرضي" },
  { code: "450", description: "مشاريع ربط محطات التحويل" },
  { code: "451", description: "ربط المناطق المعزولة" }
];

const initialWorkTypes: WorkType[] = [
  { id: "connections", name: "التوصيلات", description: "أعمال التوصيلات الكهربائية" },
  { id: "connection-projects", name: "مشاريع التوصيلات", description: "مشاريع التوصيلات" },
  { id: "projects", name: "المشاريع", description: "أعمال المشاريع" },
  { id: "maintenance", name: "الصيانة والفحص", description: "أعمال الصيانة والفحص" },
  { id: "emergency", name: "الطوارئ", description: "أعمال الطوارئ" }
];

const neighborhoodOptions = ["", "المركز", "الصناعية", "الجامعة", "الشاطئ", "الروضة", "السلام"];

function getWorkOrdersStorageKey(projectStorageKey: string) {
  return `bdcc-sec-work-orders:${projectStorageKey}`;
}

function getWorkOrderItemsStorageKey(projectStorageKey: string, workOrderNo: string) {
  return `bdcc-sec-work-order-items:${projectStorageKey}:${workOrderNo}`;
}

function parseStoredList<T>(fallback: T[], storageKey?: string): T[] {
  if (!storageKey) return fallback;
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as T[];
    return Array.isArray(parsed) && parsed.length ? parsed : fallback;
  } catch {
    window.localStorage.removeItem(storageKey);
    return fallback;
  }
}

function readWorkCodes(storageKey?: string) {
  const parsed = parseStoredList<{ code: string; description: string }>(initialWorkCodes, storageKey);
  return parsed
    .filter((item) => item && typeof item.code === "string" && typeof item.description === "string")
    .map((item) => ({ code: item.code, description: item.description }));
}

function readWorkTypes(storageKey?: string) {
  const parsed = parseStoredList<{ id: string; name: string; description?: string }>(initialWorkTypes, storageKey);
  return parsed
    .filter((item) => item && typeof item.id === "string" && typeof item.name === "string")
    .map((item) => ({ id: item.id, name: item.name, description: item.description ?? item.name }));
}

function readWorkOrders(storageKey: string) {
  return parseStoredList<WorkOrderRecord>([], getWorkOrdersStorageKey(storageKey));
}

function persistWorkOrders(projectStorageKey: string, nextOrders: WorkOrderRecord[]) {
  window.localStorage.setItem(getWorkOrdersStorageKey(projectStorageKey), JSON.stringify(nextOrders));
}

function buildNewId(prefix = "work-order") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function readMainWorkItems(storageKey?: string) {
  return parseStoredList<WorkItemOption>([], storageKey)
    .filter((item) => item && typeof item.itemNo === "string")
    .map((item) => ({
      ...item,
      unitPrice: Number(item.unitPrice) || 0,
      contractPrice: Number(item.contractPrice) || Number(item.unitPrice) || 0,
      active: item.active !== false
    }));
}

function readWorkOrderItems(projectStorageKey: string, workOrderNo: string) {
  if (!workOrderNo) return [];
  return parseStoredList<WorkOrderItemRecord>([], getWorkOrderItemsStorageKey(projectStorageKey, workOrderNo));
}

function persistWorkOrderItems(projectStorageKey: string, workOrderNo: string, nextItems: WorkOrderItemRecord[]) {
  window.localStorage.setItem(getWorkOrderItemsStorageKey(projectStorageKey, workOrderNo), JSON.stringify(nextItems));
}

const orderItemAliases = {
  itemNo: ["item_no", "رقم البند", "Item No", "Item"],
  quantity: ["quantity", "الكمية", "الكمية الفعلية", "est_quantity", "الكمية التقديرية", "Qty"]
};

const readableOrderItemAliases = {
  itemNo: ["item_no", "رقم البند", "البند", "Item No", "Item"],
  quantity: ["quantity", "الكمية", "الكمية الفعلية", "الكمية التقديرية", "est_quantity", "Qty"]
};

const allOrderItemAliases = {
  itemNo: [...readableOrderItemAliases.itemNo, ...orderItemAliases.itemNo],
  quantity: [...readableOrderItemAliases.quantity, ...orderItemAliases.quantity]
};

function normalizeHeader(value: unknown) {
  return String(value ?? "")
    .replace(/\([^)]*\)/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function pickCell(row: Record<string, unknown>, aliases: string[]) {
  const normalizedAliases = aliases.map(normalizeHeader);
  const key = Object.keys(row).find((candidate) => normalizedAliases.includes(normalizeHeader(candidate)));
  return key ? row[key] : undefined;
}

function toText(value: unknown) {
  return String(value ?? "").trim();
}

function toNumber(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const normalized = String(value ?? "").replace(/,/g, "").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 3
  }).format(value);
}

function formatReportDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  })
    .format(date)
    .replace(/\//g, "-");
}

function emptyForm(regionName: string, cityName: string): WorkOrderFormState {
  return {
    workOrderNo: "",
    contractId: "",
    regionName,
    cityName,
    neighborhood: "",
    workTypeId: "",
    workCode: "",
    workDescription: "",
    mobileNo: "",
    subscriberName: "",
    subscriberNo: "",
    transformerNo: "",
    address: "",
    latitude: "24.7136",
    longitude: "46.6753",
    estimatedCost: "0.00",
    stationNo: "",
    approvalDate: "",
    expectedDurationDays: "",
    outageCapacity: "",
    noObjectionNo: "",
    executorName: "",
    notes: ""
  };
}

function findSelected<T extends { id: string }>(rows: T[], id: string) {
  return rows.find((row) => row.id === id);
}

export function SecWorkOrderNewClient({
  slug,
  homeSlug,
  projectName,
  projectStorageKey,
  workOrderItemsSlug,
  contracts,
  workCodeStorageKey,
  workTypeStorageKey,
  fallbackRegionName,
  fallbackCityName
}: SecWorkOrderNewClientProps) {
  const router = useRouter();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [saving, setSaving] = useState(false);
  const [workCodes, setWorkCodes] = useState<WorkCode[]>(initialWorkCodes);
  const [workTypes, setWorkTypes] = useState<WorkType[]>(initialWorkTypes);
  const [orders, setOrders] = useState<WorkOrderRecord[]>([]);
  const [form, setForm] = useState<WorkOrderFormState>(() => emptyForm(fallbackRegionName, fallbackCityName));

  useEffect(() => {
    setWorkCodes(readWorkCodes(workCodeStorageKey));
    setWorkTypes(readWorkTypes(workTypeStorageKey));
    setOrders(readWorkOrders(projectStorageKey));
  }, [projectStorageKey, workCodeStorageKey, workTypeStorageKey]);

  const selectedContract = useMemo(() => findSelected(contracts, form.contractId), [contracts, form.contractId]);
  const selectedWorkCode = useMemo(() => workCodes.find((item) => item.code === form.workCode), [form.workCode, workCodes]);
  const selectedWorkType = useMemo(() => workTypes.find((item) => item.id === form.workTypeId), [form.workTypeId, workTypes]);

  function updateField<K extends keyof WorkOrderFormState>(key: K, value: WorkOrderFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleContractChange(event: ChangeEvent<HTMLSelectElement>) {
    const contractId = event.target.value;
    const contract = findSelected(contracts, contractId);
    setForm((current) => ({
      ...current,
      contractId,
      regionName: contract?.regionName ?? current.regionName,
      cityName: current.cityName || fallbackCityName
    }));
  }

  function handleWorkCodeChange(event: ChangeEvent<HTMLSelectElement>) {
    const code = event.target.value;
    const workCode = workCodes.find((item) => item.code === code);
    setForm((current) => ({
      ...current,
      workCode: code,
      workDescription: workCode?.description ?? current.workDescription
    }));
  }

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);

    const workOrderNo = form.workOrderNo.trim();
    if (!/^\d{9}$/.test(workOrderNo)) {
      setNotice({ type: "error", message: "رقم أمر العمل يجب أن يتكون من 9 أرقام." });
      return;
    }

    if (!form.contractId || !form.workCode || !form.workTypeId) {
      setNotice({ type: "error", message: "يرجى اختيار العقد وكود الوصف ونوع العمل." });
      return;
    }

    const duplicate = orders.some((order) => order.workOrderNo === workOrderNo);
    if (duplicate) {
      setNotice({ type: "error", message: "رقم أمر العمل موجود مسبقًا داخل هذا المشروع." });
      return;
    }

    if (!selectedContract || !selectedWorkCode || !selectedWorkType) {
      setNotice({ type: "error", message: "تعذر تحميل بيانات الربط المطلوبة. أعد اختيار القيم ثم حاول مرة أخرى." });
      return;
    }

    const nextOrder: WorkOrderRecord = {
      id: buildNewId(),
      workOrderNo,
      contractId: selectedContract.id,
      contractNo: selectedContract.contractNo,
      contractName: selectedContract.contractName,
      regionName: form.regionName.trim() || fallbackRegionName,
      cityName: form.cityName.trim() || fallbackCityName,
      neighborhood: form.neighborhood.trim(),
      workTypeId: selectedWorkType.id,
      workTypeName: selectedWorkType.name,
      workCode: selectedWorkCode.code,
      workCodeDescription: selectedWorkCode.description,
      workDescription: form.workDescription.trim() || selectedWorkCode.description,
      mobileNo: form.mobileNo.trim(),
      subscriberName: form.subscriberName.trim(),
      subscriberNo: form.subscriberNo.trim(),
      transformerNo: form.transformerNo.trim(),
      address: form.address.trim(),
      latitude: form.latitude.trim(),
      longitude: form.longitude.trim(),
      estimatedCost: form.estimatedCost.trim(),
      stationNo: form.stationNo.trim(),
      approvalDate: form.approvalDate,
      expectedDurationDays: form.expectedDurationDays.trim(),
      outageCapacity: form.outageCapacity.trim(),
      noObjectionNo: form.noObjectionNo.trim(),
      executorName: form.executorName.trim(),
      notes: form.notes.trim(),
      createdAt: new Date().toISOString()
    };

    setSaving(true);
    const nextOrders = [...orders, nextOrder];
    persistWorkOrders(projectStorageKey, nextOrders);
    setOrders(nextOrders);
    setNotice({ type: "success", message: "تم حفظ أمر العمل بنجاح." });

    window.setTimeout(() => {
      setSaving(false);
      if (workOrderItemsSlug) {
        router.push(`/dashboard/${workOrderItemsSlug}?workOrder=${encodeURIComponent(nextOrder.workOrderNo)}`);
      } else {
        router.push(`/dashboard/${slug}`);
      }
    }, 450);
  }

  return (
    <section className="contractors-page" aria-label="إضافة أمر عمل جديد">
      <PageNotice notice={notice} />

      <header className="contractors-header">
        <div>
          <p>إنشاء أمر عمل جديد للمشروع الحالي</p>
          <h2>إضافة أمر عمل جديد</h2>
          <span>{projectName}</span>
        </div>
      </header>

      <div className="contractors-toolbar">
        <Link href={`/dashboard/${slug}`} className="contractors-secondary-button">
          رجوع
        </Link>
        {homeSlug ? (
          <Link href={`/dashboard/${homeSlug}`} className="contractors-secondary-button">
            <Home size={18} />
            الرئيسية
          </Link>
        ) : null}
      </div>

      <section className="contractors-form-card">
        <form className="contractors-form-grid" onSubmit={handleSave}>
          <Field label="العقد *">
            <select value={form.contractId} onChange={handleContractChange}>
              <option value="">اختر العقد</option>
              {contracts.map((contract) => (
                <option key={contract.id} value={contract.id}>
                  {contract.contractNo}
                </option>
              ))}
            </select>
          </Field>

          <Field label="رقم أمر العمل *">
            <input
              value={form.workOrderNo}
              onChange={(event) => updateField("workOrderNo", event.target.value.replace(/\D/g, "").slice(0, 9))}
              inputMode="numeric"
              dir="ltr"
              placeholder="مثال: 264006694"
            />
          </Field>

          <Field label="المنطقة *">
            <select value={form.regionName} onChange={(event) => updateField("regionName", event.target.value)}>
              <option value={fallbackRegionName}>{fallbackRegionName}</option>
            </select>
          </Field>

          <Field label="المدينة *">
            <select value={form.cityName} onChange={(event) => updateField("cityName", event.target.value)}>
              <option value={fallbackCityName}>{fallbackCityName}</option>
            </select>
          </Field>

          <Field label="الحي *">
            <select value={form.neighborhood} onChange={(event) => updateField("neighborhood", event.target.value)}>
              <option value="">اختر الحي</option>
              {neighborhoodOptions
                .filter(Boolean)
                .map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
            </select>
          </Field>

          <Field label="كود الوصف *">
            <select value={form.workCode} onChange={handleWorkCodeChange}>
              <option value="">اختر كود الوصف</option>
              {workCodes.map((code) => (
                <option key={code.code} value={code.code}>
                  {code.code}
                </option>
              ))}
            </select>
          </Field>

          <Field label="وصف العمل">
            <input value={form.workDescription} onChange={(event) => updateField("workDescription", event.target.value)} />
          </Field>

          <Field label="نوع العمل *">
            <select value={form.workTypeId} onChange={(event) => updateField("workTypeId", event.target.value)}>
              <option value="">اختر نوع العمل</option>
              {workTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="اسم المشترك">
            <input value={form.subscriberName} onChange={(event) => updateField("subscriberName", event.target.value)} />
          </Field>

          <Field label="رقم الجوال">
            <input value={form.mobileNo} onChange={(event) => updateField("mobileNo", event.target.value)} dir="ltr" inputMode="tel" />
          </Field>

          <Field label="رقم المشترك">
            <input value={form.subscriberNo} onChange={(event) => updateField("subscriberNo", event.target.value)} dir="ltr" />
          </Field>

          <Field label="رقم المحول">
            <input value={form.transformerNo} onChange={(event) => updateField("transformerNo", event.target.value)} dir="ltr" />
          </Field>

          <Field label="العنوان" full>
            <textarea value={form.address} onChange={(event) => updateField("address", event.target.value)} rows={3} />
          </Field>

          <Field label="خط العرض (Latitude)">
            <input value={form.latitude} onChange={(event) => updateField("latitude", event.target.value)} dir="ltr" />
          </Field>

          <Field label="خط الطول (Longitude)">
            <input value={form.longitude} onChange={(event) => updateField("longitude", event.target.value)} dir="ltr" />
          </Field>

          <Field label="رقم المحطة">
            <input value={form.stationNo} onChange={(event) => updateField("stationNo", event.target.value)} dir="ltr" />
          </Field>

          <Field label="تكلفة أمر العمل">
            <input value={form.estimatedCost} onChange={(event) => updateField("estimatedCost", event.target.value)} dir="ltr" />
          </Field>

          <Field label="قدرة القواطع">
            <input value={form.outageCapacity} onChange={(event) => updateField("outageCapacity", event.target.value)} placeholder="مثال: 100A" />
          </Field>

          <Field label="المدة المتوقعة (باليوم)">
            <input value={form.expectedDurationDays} onChange={(event) => updateField("expectedDurationDays", event.target.value)} placeholder="مثال: 30" />
          </Field>

          <Field label="تاريخ الاعتماد">
            <input type="date" value={form.approvalDate} onChange={(event) => updateField("approvalDate", event.target.value)} />
          </Field>

          <Field label="رقم عدم الممانعة">
            <input value={form.noObjectionNo} onChange={(event) => updateField("noObjectionNo", event.target.value)} placeholder="مثال: NOC-2024-001" />
          </Field>

          <Field label="جهة التنفيذ">
            <input value={form.executorName} onChange={(event) => updateField("executorName", event.target.value)} placeholder="مثال: شركة المقاولات" />
          </Field>

          <Field label="ملاحظات" full>
            <textarea value={form.notes} onChange={(event) => updateField("notes", event.target.value)} rows={5} />
          </Field>

          <div className="contractors-inline-meta contractors-field-full">
            <div className="contractors-inline-chip">
              <strong>رقم العقد المختار:</strong>
              <span>{selectedContract?.contractNo ?? "-"}</span>
            </div>
            <div className="contractors-inline-chip">
              <strong>الوصف المرتبط:</strong>
              <span>{selectedWorkCode?.description ?? "-"}</span>
            </div>
            <div className="contractors-inline-chip">
              <strong>نوع العمل:</strong>
              <span>{selectedWorkType?.name ?? "-"}</span>
            </div>
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

function LegacySecWorkOrderItemsClient({
  slug,
  homeSlug,
  projectName,
  projectStorageKey,
  selectedWorkOrderNo
}: SecWorkOrderItemsClientProps) {
  const [orders, setOrders] = useState<WorkOrderRecord[]>([]);

  useEffect(() => {
    setOrders(readWorkOrders(projectStorageKey));
  }, [projectStorageKey]);

  const selectedOrder = useMemo(() => {
    if (!selectedWorkOrderNo) return orders[orders.length - 1];
    return orders.find((order) => order.workOrderNo === selectedWorkOrderNo) ?? orders[orders.length - 1];
  }, [orders, selectedWorkOrderNo]);

  return (
    <section className="contractors-page" aria-label="بنود اعمال أمر">
      <header className="contractors-header">
        <div>
          <p>متابعة بنود أمر العمل الحالي</p>
          <h2>بنود اعمال أمر</h2>
          <span>{projectName}</span>
        </div>
      </header>

      <div className="contractors-toolbar">
        <Link href={`/dashboard/${slug.replace(/\\?mode=new$/, "")}`} className="contractors-secondary-button">
          <PlusCircle size={18} />
          أمر عمل جديد
        </Link>
        {homeSlug ? (
          <Link href={`/dashboard/${homeSlug}`} className="contractors-secondary-button">
            <Home size={18} />
            الرئيسية
          </Link>
        ) : null}
      </div>

      <section className="contractors-form-card">
        {selectedOrder ? (
          <>
            <div className="contractors-summary-grid">
              <SummaryCard label="رقم أمر العمل" value={selectedOrder.workOrderNo} />
              <SummaryCard label="العقد" value={selectedOrder.contractNo} />
              <SummaryCard label="كود الوصف" value={selectedOrder.workCode} />
              <SummaryCard label="نوع العمل" value={selectedOrder.workTypeName} />
              <SummaryCard label="المنطقة / المدينة" value={`${selectedOrder.regionName} / ${selectedOrder.cityName}`} />
              <SummaryCard label="الوصف" value={selectedOrder.workDescription} />
            </div>

            <div className="contractors-empty-card sec-order-items-empty">
              <FileText size={56} />
              <h3>لا توجد بنود مرتبطة بهذا الأمر بعد</h3>
              <p>تم حفظ أمر العمل بنجاح، وسيظهر هذا الرقم لاحقًا عند ربط بنود أعمال الأمر به.</p>
            </div>
          </>
        ) : (
          <div className="contractors-empty-card sec-order-items-empty">
            <FileText size={56} />
            <h3>لا يوجد أمر عمل محفوظ لهذا المشروع بعد</h3>
            <Link href={`/dashboard/${slug.replace("menu-0-1-1-5-2", "menu-0-1-1-5-1")}`} className="contractors-primary-button">
              <PlusCircle size={18} />
              إضافة أمر عمل جديد
            </Link>
          </div>
        )}
      </section>
    </section>
  );
}

type SecOrderItemsView = "select" | "manage" | "import" | "preview" | "report";

export function SecWorkOrderItemsClient({
  slug,
  homeSlug,
  projectName,
  projectStorageKey,
  selectedWorkOrderNo,
  workItemsStorageKey
}: SecWorkOrderItemsClientProps) {
  const [orders, setOrders] = useState<WorkOrderRecord[]>([]);
  const [workItems, setWorkItems] = useState<WorkItemOption[]>([]);
  const [selectedOrderNo, setSelectedOrderNo] = useState(selectedWorkOrderNo ?? "");
  const [items, setItems] = useState<WorkOrderItemRecord[]>([]);
  const [selectedItemNo, setSelectedItemNo] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [searchText, setSearchText] = useState("");
  const [previewRows, setPreviewRows] = useState<WorkOrderItemPreview[]>([]);
  const [view, setView] = useState<SecOrderItemsView>(selectedWorkOrderNo ? "manage" : "select");
  const [notice, setNotice] = useState<Notice | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const nextOrders = readWorkOrders(projectStorageKey);
    setOrders(nextOrders);
    setWorkItems(readMainWorkItems(workItemsStorageKey));
    setSelectedOrderNo((current) => current || selectedWorkOrderNo || nextOrders[0]?.workOrderNo || "");
  }, [projectStorageKey, selectedWorkOrderNo, workItemsStorageKey]);

  useEffect(() => {
    if (selectedWorkOrderNo) {
      setSelectedOrderNo(selectedWorkOrderNo);
      setView("manage");
    }
  }, [selectedWorkOrderNo]);

  const selectedOrder = useMemo(() => {
    if (!orders.length) return undefined;
    return orders.find((order) => order.workOrderNo === selectedOrderNo) ?? orders[0];
  }, [orders, selectedOrderNo]);

  useEffect(() => {
    if (!selectedOrder) {
      setItems([]);
      return;
    }
    setItems(readWorkOrderItems(projectStorageKey, selectedOrder.workOrderNo));
  }, [projectStorageKey, selectedOrder]);

  const availableWorkItems = useMemo(() => {
    const activeItems = workItems.filter((item) => item.active !== false);
    if (!selectedOrder?.contractId) return activeItems;
    const contractItems = activeItems.filter((item) => item.contractId === selectedOrder.contractId);
    return contractItems.length ? contractItems : activeItems;
  }, [selectedOrder?.contractId, workItems]);

  const selectedMainItem = availableWorkItems.find((item) => item.itemNo === selectedItemNo);
  const filteredOrders = orders.filter((order) => {
    const term = searchText.trim().toLowerCase();
    if (!term) return true;
    return [order.workOrderNo, order.workCode, order.contractName, order.contractNo].some((value) => value.toLowerCase().includes(term));
  });
  const filteredItems = items.filter((item) => {
    const term = searchText.trim().toLowerCase();
    if (!term) return true;
    return [item.itemNo, item.description, item.unit].some((value) => value.toLowerCase().includes(term));
  });
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = items.reduce((sum, item) => sum + item.total, 0);

  function showNotice(message: string, type: Notice["type"] = "success") {
    setNotice({ message, type });
    window.setTimeout(() => setNotice(null), 2400);
  }

  function persistCurrentItems(nextItems: WorkOrderItemRecord[]) {
    if (!selectedOrder) return;
    persistWorkOrderItems(projectStorageKey, selectedOrder.workOrderNo, nextItems);
    setItems(nextItems);
  }

  function manageOrder(orderNo: string) {
    setSelectedOrderNo(orderNo);
    setSearchText("");
    setView("manage");
  }

  function addSelectedItem() {
    if (!selectedOrder || !selectedMainItem) {
      showNotice("اختر أمر العمل والبند أولا.", "error");
      return;
    }
    const parsedQuantity = toNumber(quantity);
    if (parsedQuantity <= 0) {
      showNotice("أدخل كمية أكبر من صفر.", "error");
      return;
    }
    const price = Number(selectedMainItem.contractPrice ?? selectedMainItem.unitPrice) || 0;
    const existing = items.find((item) => item.itemNo === selectedMainItem.itemNo);
    const nextItem: WorkOrderItemRecord = {
      id: existing?.id ?? buildNewId("order-item"),
      itemNo: selectedMainItem.itemNo,
      description: selectedMainItem.description,
      unit: selectedMainItem.unit,
      unitPrice: price,
      quantity: parsedQuantity,
      total: parsedQuantity * price,
      active: true,
      createdAt: existing?.createdAt ?? new Date().toISOString()
    };
    const nextItems = existing ? items.map((item) => (item.itemNo === nextItem.itemNo ? nextItem : item)) : [...items, nextItem];
    persistCurrentItems(nextItems);
    setSelectedItemNo("");
    setQuantity("1");
    showNotice("تم حفظ التغييرات.");
  }

  function deleteItem(itemNo: string) {
    persistCurrentItems(items.filter((item) => item.itemNo !== itemNo));
    showNotice("تم حذف البند وحفظ التغييرات.");
  }

  function downloadTemplate() {
    const worksheet = XLSX.utils.json_to_sheet([{ item_no: "", quantity: "" }], { header: ["item_no", "quantity"] });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "items");
    XLSX.writeFile(workbook, `work-order-items-template.xlsx`);
  }

  async function readImportFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !selectedOrder) return;

    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: "" });
      const nextPreview = rows
        .map((row) => {
          const itemNo = toText(pickCell(row, allOrderItemAliases.itemNo));
          const parsedQuantity = toNumber(pickCell(row, allOrderItemAliases.quantity));
          const mainItem = availableWorkItems.find((item) => item.itemNo === itemNo);
          const existing = items.find((item) => item.itemNo === itemNo);
          const price = Number(mainItem?.contractPrice ?? mainItem?.unitPrice ?? existing?.unitPrice ?? 0);
          const baseItem = mainItem ?? existing;
          const status: WorkOrderItemPreview["status"] = !itemNo || !baseItem || parsedQuantity <= 0 ? "error" : existing ? "update" : "new";

          return {
            id: existing?.id ?? buildNewId("preview-item"),
            itemNo,
            description: baseItem?.description ?? "",
            unit: baseItem?.unit ?? "",
            unitPrice: price,
            quantity: parsedQuantity,
            total: parsedQuantity * price,
            active: true,
            createdAt: existing?.createdAt ?? new Date().toISOString(),
            status,
            message: status === "error" ? "رقم بند غير موجود أو كمية غير صحيحة" : status === "update" ? "تحديث بند موجود" : "بند جديد"
          };
        })
        .filter((row) => row.itemNo);

      setPreviewRows(nextPreview);
      setView("preview");
      event.target.value = "";
    } catch {
      showNotice("تعذر قراءة ملف Excel.", "error");
    }
  }

  function confirmPreviewImport() {
    const validRows = previewRows.filter((row) => row.status !== "error");
    if (!validRows.length) {
      showNotice("لا توجد بنود صالحة للاستيراد.", "error");
      return;
    }
    const byItemNo = new Map(items.map((item) => [item.itemNo, item]));
    validRows.forEach((row) => {
      byItemNo.set(row.itemNo, {
        id: byItemNo.get(row.itemNo)?.id ?? row.id,
        itemNo: row.itemNo,
        description: row.description,
        unit: row.unit,
        unitPrice: row.unitPrice,
        quantity: row.quantity,
        total: row.total,
        active: true,
        createdAt: byItemNo.get(row.itemNo)?.createdAt ?? row.createdAt
      });
    });
    persistCurrentItems(Array.from(byItemNo.values()));
    setPreviewRows([]);
    setView("manage");
    showNotice("تم استيراد البنود وحفظ التغييرات.");
  }

  function exportExcel() {
    if (!selectedOrder) return;
    const worksheet = XLSX.utils.json_to_sheet(
      items.map((item, index) => ({
        "#": index + 1,
        "رقم أمر العمل": selectedOrder.workOrderNo,
        "كود وصف العمل": selectedOrder.workCode,
        "رقم البند": item.itemNo,
        الوصف: item.description,
        الوحدة: item.unit,
        "سعر الوحدة": item.unitPrice,
        الكمية: item.quantity,
        الإجمالي: item.total
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "work_order_items");
    XLSX.writeFile(workbook, `work-order-items-${selectedOrder.workOrderNo}.xlsx`);
  }

  if (!selectedOrder && view !== "select") {
    return (
      <section className="sec-order-page">
        <PageNotice notice={notice} />
        <div className="contractors-empty-card sec-order-items-empty">
          <FileText size={56} />
          <h3>لا يوجد أمر عمل محفوظ لهذا المشروع بعد.</h3>
        </div>
      </section>
    );
  }

  return (
    <section className="sec-order-page" aria-label="بنود أعمال أمر العمل">
      <PageNotice notice={notice} />

      {view === "select" ? (
        <>
          <header className="sec-order-header">
            <div>
              <p>اختر أمر عمل لإدارة البنود</p>
              <h2>بنود الأعمال - اختيار أمر</h2>
              <span>{projectName}</span>
            </div>
          </header>

          <div className="sec-order-toolbar">
            <Link href={`/dashboard/${slug.replace("menu-0-1-1-5-2", "menu-0-1-1-5-1")}`} className="contractors-secondary-button">
              <PlusCircle size={18} />
              أمر عمل جديد
            </Link>
            {homeSlug ? (
              <Link href={`/dashboard/${homeSlug}`} className="contractors-secondary-button">
                <Home size={18} />
                الرئيسية
              </Link>
            ) : null}
          </div>

          <section className="sec-order-panel">
            <div className="sec-order-filter-row">
              <input value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="بحث برقم أمر العمل أو العقد" />
              <button type="button" className="contractors-secondary-button">
                <Search size={18} />
                بحث
              </button>
            </div>
            <div className="sec-orders-table">
              <div className="sec-orders-head">
                <span>#</span>
                <span>رقم الأمر</span>
                <span>كود الوصف</span>
                <span>العقد</span>
                <span>إجراء</span>
              </div>
              {filteredOrders.length ? (
                filteredOrders.map((order, index) => (
                  <div className="sec-orders-row" key={order.id}>
                    <span>{index + 1}</span>
                    <strong>{order.workOrderNo}</strong>
                    <span>{order.workCode}</span>
                    <span>{order.contractName}</span>
                    <button type="button" onClick={() => manageOrder(order.workOrderNo)} className="contractors-secondary-button">
                      إدارة البنود
                    </button>
                  </div>
                ))
              ) : (
                <div className="sec-orders-empty">لا توجد أوامر عمل محفوظة.</div>
              )}
            </div>
          </section>
        </>
      ) : null}

      {selectedOrder && view === "manage" ? (
        <>
          <header className="sec-order-header">
            <div>
              <p>بنود الأعمال - أمر {selectedOrder.workOrderNo}</p>
              <h2>بنود الأعمال</h2>
              <span>{selectedOrder.workCode} - {selectedOrder.contractName}</span>
            </div>
          </header>

          <div className="sec-order-toolbar">
            <button type="button" className="contractors-primary-button" onClick={() => setView("import")}>
              <UploadCloud size={18} />
              استيراد Excel
            </button>
            <button type="button" className="contractors-secondary-button" onClick={exportExcel} disabled={!items.length}>
              <FileSpreadsheet size={18} />
              تصدير Excel
            </button>
            <button type="button" className="contractors-secondary-button" onClick={() => setView("report")}>
              <Printer size={18} />
              طباعة بنود الأعمال
            </button>
            <button type="button" className="contractors-secondary-button" onClick={() => setView("select")}>
              رجوع
            </button>
          </div>

          <section className="sec-order-panel">
            <h3>إضافة بند من قائمة البنود الرئيسية</h3>
            <div className="sec-order-add-grid">
              <Field label="اختر البند">
                <select value={selectedItemNo} onChange={(event) => setSelectedItemNo(event.target.value)}>
                  <option value="">اختر من work_items</option>
                  {availableWorkItems.map((item) => (
                    <option value={item.itemNo} key={item.id}>
                      {item.itemNo} - {item.description.slice(0, 90)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="سعر الوحدة">
                <input value={selectedMainItem ? formatMoney(Number(selectedMainItem.contractPrice ?? selectedMainItem.unitPrice) || 0) : "-"} readOnly />
              </Field>
              <Field label="كمية تقديرية">
                <input value={quantity} onChange={(event) => setQuantity(event.target.value)} inputMode="decimal" />
              </Field>
              <Field label="الإجمالي">
                <input value={selectedMainItem ? formatMoney((Number(selectedMainItem.contractPrice ?? selectedMainItem.unitPrice) || 0) * toNumber(quantity)) : "-"} readOnly />
              </Field>
              <button type="button" className="contractors-primary-button" onClick={addSelectedItem}>
                <PlusCircle size={18} />
                إضافة
              </button>
            </div>
          </section>

          <section className="sec-order-panel">
            <div className="sec-order-panel-title">
              <h3>البنود المسجلة لهذا الأمر ({items.length})</h3>
              <input value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="بحث في البنود" />
            </div>
            <div className="sec-items-table">
              <div className="sec-items-head">
                <span>#</span>
                <span>رقم البند</span>
                <span>الوصف</span>
                <span>الوحدة</span>
                <span>سعر الوحدة</span>
                <span>الكمية</span>
                <span>الإجمالي</span>
                <span>إجراء</span>
              </div>
              {filteredItems.length ? (
                filteredItems.map((item, index) => (
                  <div className="sec-items-row" key={item.id}>
                    <span>{index + 1}</span>
                    <strong>{item.itemNo}</strong>
                    <span>{item.description}</span>
                    <span>{item.unit}</span>
                    <span>{formatMoney(item.unitPrice)}</span>
                    <span>{formatMoney(item.quantity)}</span>
                    <span>{formatMoney(item.total)}</span>
                    <button type="button" className="contractors-danger-button" onClick={() => deleteItem(item.itemNo)}>
                      حذف
                    </button>
                  </div>
                ))
              ) : (
                <div className="sec-orders-empty">لا توجد بنود مسجلة لهذا الأمر.</div>
              )}
              <div className="sec-items-total">
                <strong>إجمالي الكميات: {formatMoney(totalQuantity)}</strong>
                <strong>إجمالي البنود: {items.length}</strong>
                <strong>إجمالي القيمة: {formatMoney(totalValue)}</strong>
              </div>
            </div>
          </section>
        </>
      ) : null}

      {selectedOrder && view === "import" ? (
        <section className="sec-order-panel sec-order-import">
          <h2>
            <UploadCloud size={26} />
            استيراد بنود أمر العمل من Excel
          </h2>
          <div className="sec-order-help">
            <strong>تعليمات مهمة:</strong>
            <p>حمّل القالب، عبئ الأعمدة المطلوبة، ثم ارفع الملف لمعاينة البيانات قبل الحفظ.</p>
            <table>
              <tbody>
                <tr><th>رقم البند</th><td>item_no أو رقم البند</td></tr>
                <tr><th>الكمية</th><td>quantity أو الكمية أو الكمية التقديرية</td></tr>
              </tbody>
            </table>
          </div>
          <div className="sec-order-toolbar">
            <button type="button" className="contractors-secondary-button" onClick={downloadTemplate}>
              <Download size={18} />
              تنزيل نموذج Excel فارغ
            </button>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={readImportFile} />
            <button type="button" className="contractors-secondary-button" onClick={() => setView("manage")}>
              رجوع
            </button>
          </div>
        </section>
      ) : null}

      {selectedOrder && view === "preview" ? (
        <section className="sec-order-panel">
          <h2>معاينة البيانات قبل الاستيراد</h2>
          <p className="sec-order-muted">سيتم تحديث البنود الموجودة وإضافة البنود الجديدة لهذا الأمر فقط.</p>
          <div className="sec-items-table sec-preview-table">
            <div className="sec-items-head">
              <span>الحالة</span>
              <span>رقم البند</span>
              <span>الوصف</span>
              <span>الوحدة</span>
              <span>الكمية</span>
              <span>الإجمالي</span>
              <span>ملاحظات</span>
            </div>
            {previewRows.map((row) => (
              <div className={`sec-items-row sec-preview-${row.status}`} key={row.id}>
                <span>{row.status === "new" ? "جديد" : row.status === "update" ? "تحديث" : "خطأ"}</span>
                <strong>{row.itemNo}</strong>
                <span>{row.description || "-"}</span>
                <span>{row.unit || "-"}</span>
                <span>{formatMoney(row.quantity)}</span>
                <span>{formatMoney(row.total)}</span>
                <span>{row.message}</span>
              </div>
            ))}
          </div>
          <div className="sec-order-toolbar">
            <button type="button" className="contractors-primary-button" onClick={confirmPreviewImport}>
              <CheckCircle2 size={18} />
              تأكيد وحفظ التغييرات
            </button>
            <button type="button" className="contractors-secondary-button" onClick={() => setView("import")}>
              إلغاء
            </button>
          </div>
        </section>
      ) : null}

      {selectedOrder && view === "report" ? (
        <>
          <div className="sec-order-toolbar no-print">
            <button type="button" className="contractors-secondary-button" onClick={() => setView("manage")}>رجوع</button>
            <button type="button" className="contractors-secondary-button" onClick={exportExcel}>
              <FileSpreadsheet size={18} />
              تصدير Excel
            </button>
            <button type="button" className="contractors-primary-button" onClick={() => window.print()}>
              <Printer size={18} />
              طباعة
            </button>
          </div>
          <section className="sec-order-report sec-order-printable">
            <div className="sec-order-report-head">
              <img src="/logo.jpg" alt="BDCC" />
              <div>
                <h2>تقرير بنود أعمال أمر عمل</h2>
                <p>بداية النجاح - تيار | نظام إدارة العقود</p>
              </div>
              <span>التاريخ: {new Date().toLocaleDateString("en-GB")}</span>
            </div>
            <div className="sec-order-report-meta">
              <strong>رقم أمر العمل: {selectedOrder.workOrderNo}</strong>
              <strong>كود وصف العمل: {selectedOrder.workCode}</strong>
              <strong>العقد: {selectedOrder.contractName}</strong>
            </div>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>رقم البند</th>
                  <th>الوصف</th>
                  <th>الوحدة</th>
                  <th>سعر الوحدة</th>
                  <th>الكمية</th>
                  <th>الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                {items.length ? (
                  items.map((item, index) => (
                    <tr key={item.id}>
                      <td>{index + 1}</td>
                      <td>{item.itemNo}</td>
                      <td>{item.description}</td>
                      <td>{item.unit}</td>
                      <td>{formatMoney(item.unitPrice)}</td>
                      <td>{formatMoney(item.quantity)}</td>
                      <td>{formatMoney(item.total)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7}>لا توجد بنود</td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4}>الإجماليات</td>
                  <td>{items.length}</td>
                  <td>{formatMoney(totalQuantity)}</td>
                  <td>{formatMoney(totalValue)}</td>
                </tr>
              </tfoot>
            </table>
          </section>
        </>
      ) : null}
    </section>
  );
}

function Field({ label, full, children }: { label: string; full?: boolean; children: ReactNode }) {
  return (
    <label className={full ? "contractors-field contractors-field-full" : "contractors-field"}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="contractors-summary-card">
      <strong>{label}</strong>
      <span>{value || "-"}</span>
    </article>
  );
}

function PageNotice({ notice }: { notice: Notice | null }) {
  if (!notice) return null;
  return (
    <div className={`profile-toast profile-toast-${notice.type}`} role="status">
      {notice.type === "success" ? <CheckCircle2 size={54} /> : null}
      <strong>{notice.message}</strong>
    </div>
  );
}
