import fs from "node:fs";

const sourcePath = "menu_items.json";
const items = JSON.parse(fs.readFileSync(sourcePath, "utf8"));

const sharedServices = {
  "0.2": "الخدمات المشتركة",
  "0.2.1": "الموارد البشرية",
  "0.2.1.1": "بيانات الموظفين",
  "0.2.1.2": "العقود",
  "0.2.1.3": "الرواتب",
  "0.2.1.4": "الإجازات",
  "0.2.1.5": "تقييم الأداء",
  "0.2.1.6": "التدريب والتطوير",
  "0.2.2": "الشؤون القانونية",
  "0.2.2.1": "المخالفات",
  "0.2.2.2": "الاعتراضات",
  "0.2.2.3": "القضايا",
  "0.2.2.4": "الأحكام",
  "0.2.2.4.1": "أحكام ابتدائية",
  "0.2.2.4.2": "استئناف",
  "0.2.2.4.3": "أحكام نهائية",
  "0.2.2.4.4": "أحكام التنفيذ",
  "0.2.2.5": "الجلسات",
  "0.2.2.6": "الجهات",
  "0.2.2.7": "فواتير السداد",
  "0.2.2.8": "المواعيد",
  "0.2.2.9": "تحليل الإحصائيات",
  "0.2.2.10": "التراخيص",
  "0.2.2.11": "المقاولين",
  "0.2.2.12": "المتابعة والإشراف",
  "0.2.3": "المالية العامة",
  "0.2.3.1": "الحسابات العامة",
  "0.2.3.2": "القيود اليومية",
  "0.2.3.3": "الميزانيات",
  "0.2.3.4": "التقارير المالية",
  "0.2.3.5": "التدفقات النقدية",
  "0.2.3.6": "الأصول",
  "0.2.4": "المشتريات",
  "0.2.4.1": "طلبات الشراء",
  "0.2.4.2": "أوامر الشراء",
  "0.2.4.3": "الموردين",
  "0.2.4.4": "العقود",
  "0.2.4.5": "التقييم",
  "0.2.5": "تقنية المعلومات",
  "0.2.5.1": "إدارة المستخدمين",
  "0.2.5.2": "الصلاحيات",
  "0.2.5.3": "الأنظمة",
  "0.2.5.4": "الدعم الفني",
  "0.2.5.5": "البنية التحتية",
  "0.2.6": "الأرشيف العام",
  "0.2.6.1": "الأرشفة الإلكترونية",
  "0.2.6.2": "إدارة الوثائق",
  "0.2.6.3": "تصنيف الملفات",
  "0.2.6.4": "البحث والاسترجاع",
  "0.2.7": "إدارة العقود",
  "0.2.7.1": "عقود المشاريع",
  "0.2.7.2": "عقود الموردين",
  "0.2.7.3": "عقود المقاولين",
  "0.2.7.4": "متابعة التنفيذ",
  "0.2.8": "الخدمات الإدارية",
  "0.2.8.1": "إدارة المكاتب",
  "0.2.8.2": "إدارة الأصول",
  "0.2.8.3": "الصيانة العامة",
  "0.2.8.4": "الخدمات اللوجستية",
  "0.2.8.5": "النقل والحركة",
  "0.2.8.6": "الأمن والسلامة",
  "0.2.8.7": "الضيافة",
  "0.2.8.8": "النظافة",
  "0.2.8.9": "متابعة العقود الإدارية",
  "0.2.8.10": "المستلزمات المكتبية"
};

const existingByCode = new Map(items.map((item) => [item.wbs_code, item]));
const sharedCodes = Object.keys(sharedServices);
const hasChildren = new Set(sharedCodes.map((code) => code.split(".").slice(0, -1).join(".")));

function parentCode(code) {
  const parts = code.split(".");
  return parts.length > 1 ? parts.slice(0, -1).join(".") : null;
}

function level(code) {
  return code.split(".").length;
}

function slugFor(code) {
  const existing = existingByCode.get(code);
  if (existing?.slug) return existing.slug;
  return `menu-${code.replaceAll(".", "-")}`;
}

function fullPath(code) {
  const parts = code.split(".");
  const path = [];
  for (let index = 1; index <= parts.length; index += 1) {
    const currentCode = parts.slice(0, index).join(".");
    const current = sharedServices[currentCode] ?? existingByCode.get(currentCode)?.name_ar;
    if (current) path.push(current);
  }
  return path.join(" > ");
}

const nextItems = items.filter((item) => !item.wbs_code.startsWith("0.2"));
for (const code of sharedCodes) {
  nextItems.push({
    wbs_code: code,
    level: level(code),
    parent_code: parentCode(code),
    name_ar: sharedServices[code],
    has_children: hasChildren.has(code),
    full_path_ar: fullPath(code),
    slug: slugFor(code),
    group_no: 3,
    subgroup_no: null
  });
}

nextItems.sort((a, b) => {
  const aParts = a.wbs_code.split(".").map(Number);
  const bParts = b.wbs_code.split(".").map(Number);
  const length = Math.max(aParts.length, bParts.length);
  for (let index = 0; index < length; index += 1) {
    const diff = (aParts[index] ?? -1) - (bParts[index] ?? -1);
    if (diff !== 0) return diff;
  }
  return 0;
});

fs.writeFileSync(sourcePath, `${JSON.stringify(nextItems, null, 2)}\n`, "utf8");
console.log(`Updated shared services menu to ${sharedCodes.length} rows.`);
