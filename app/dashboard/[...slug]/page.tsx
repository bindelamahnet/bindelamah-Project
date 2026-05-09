import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Activity,
  CalendarDays,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  Droplets,
  Eye,
  FileText,
  FolderKanban,
  Home,
  Network,
  Pencil,
  PieChart,
  PlusCircle,
  Save,
  ShieldCheck,
  Users,
  XCircle,
  Zap
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  buildProjectMenuRows,
  projectMatchesConfig,
  removeTransformedProjectDescendants,
  type CatalogRegion,
  type ProjectRow
} from "@/lib/erp/project-menu";
import type { MenuRow } from "@/lib/erp/types";
import ElectricalProjectsClient from "./ElectricalProjectsClient";
import RegionsManagerClient from "./RegionsManagerClient";

type PageProps = {
  params: Promise<{ slug: string[] }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type RegionCard = {
  code: string;
  name: string;
  count: number;
};

type TaskBasketView = "work-orders" | "leave-approvals";

type TaskBasketCard = {
  view: TaskBasketView;
  title: string;
  description: string;
  count: number;
  icon: typeof FolderKanban | typeof CheckCircle2;
  tone: "violet" | "gold";
};

type ContractRecord = {
  id: string;
  contractNo: string;
  contractName: string;
  regionName: string;
  startDate: string;
  endDate: string;
  status: "نشط" | "معلق" | "منتهي";
  workOrderCount: number;
  notes: string;
};

const projectWorkTypeCards = [
  { title: "التوصيلات", total: 666, percent: "64%", done: 666, executing: 0, pending: 0, tone: "blue", icon: Zap },
  { title: "مشاريع التوصيلات", total: 84, percent: "8%", done: 84, executing: 0, pending: 0, tone: "teal", icon: Network },
  { title: "المشاريع", total: 108, percent: "10%", done: 102, executing: 2, pending: 4, tone: "violet", icon: FolderKanban },
  { title: "الصيانة والفحص", total: 58, percent: "6%", done: 58, executing: 0, pending: 0, tone: "cyan", icon: ShieldCheck },
  { title: "الطوارئ", total: 126, percent: "12%", done: 126, executing: 0, pending: 0, tone: "red", icon: Activity }
];

const projectStatusDistribution = [
  { label: "جديد", value: 1, percent: 0, color: "#2f80ed" },
  { label: "تحت التنفيذ", value: 4, percent: 0, color: "#18b990" },
  { label: "مرحلة إغلاق", value: 2, percent: 0, color: "#f6a611" },
  { label: "اعتماد مستخلص", value: 1033, percent: 99, color: "#8056f6" },
  { label: "منتهي", value: 4, percent: 0, color: "#f04444" }
];

function readRoleId(row: any) {
  const role = Array.isArray(row.roles) ? row.roles[0] : row.roles;
  return role?.id as string | undefined;
}

function projectContextName(fullPath: string, sectionName: string) {
  const parts = fullPath.split(" > ");
  const index = parts.lastIndexOf(sectionName);
  if (index > 0) return parts[index - 1];
  return parts.at(-2) ?? parts.at(-1) ?? sectionName;
}

function readProjectContext(fullPath: string) {
  const parts = fullPath.split(" > ");
  const homeIndex = parts.lastIndexOf("الرئيسية");

  return {
    projectName: homeIndex > 0 ? parts[homeIndex - 1] : parts.at(-1) ?? "المشروع الحالي",
    cityName: homeIndex > 1 ? parts[homeIndex - 2] : "غير محدد",
    regionName: homeIndex > 2 ? parts[homeIndex - 3] : "غير محدد"
  };
}

function findProjectHomeRow(rows: MenuRow[], item: MenuRow) {
  const rowsByCode = new Map(rows.map((row) => [row.wbs_code, row]));
  let currentCode = item.parent_wbs_code;

  while (currentCode) {
    const parent = rowsByCode.get(currentCode);
    if (!parent) break;
    if (parent.wbs_code.endsWith(".home")) return parent;
    currentCode = parent.parent_wbs_code;
  }

  return null;
}

function buildProjectContracts(projectName: string, regionName: string): ContractRecord[] {
  const digits = (projectName.match(/\d+/)?.[0] ?? "100").slice(-3);

  return [
    {
      id: `${projectName}-contract-1`,
      contractNo: `CN-${digits}01`,
      contractName: `عقد أعمال التشغيل - ${projectName}`,
      regionName,
      startDate: "2026-05-07",
      endDate: "2026-12-31",
      status: "نشط",
      workOrderCount: 3,
      notes: `عقد تشغيلي مرتبط بالمشروع ${projectName} في نطاق ${regionName}.`
    },
    {
      id: `${projectName}-contract-2`,
      contractNo: `CN-${digits}02`,
      contractName: `عقد صيانة دورية - ${projectName}`,
      regionName,
      startDate: "2026-06-01",
      endDate: "2026-11-30",
      status: "نشط",
      workOrderCount: 1,
      notes: `متابعة أعمال الصيانة الوقائية الخاصة بالمشروع ${projectName}.`
    },
    {
      id: `${projectName}-contract-3`,
      contractNo: `CN-${digits}03`,
      contractName: `عقد خدمات مساندة - ${projectName}`,
      regionName,
      startDate: "2026-04-15",
      endDate: "2026-09-15",
      status: "معلق",
      workOrderCount: 0,
      notes: `عقد خدمات مساندة بانتظار اعتماد نطاق التنفيذ للمشروع ${projectName}.`
    }
  ];
}

function ContractsPage({
  item,
  homeSlug,
  contractRows,
  projectName
}: {
  item: MenuRow;
  homeSlug?: string;
  contractRows: ContractRecord[];
  projectName: string;
}) {
  return (
    <section className="contracts-page" aria-label="العقود">
      <header className="contracts-header">
        <div>
          <p>إدارة العقود الخاصة بالمشروع الحالي</p>
          <h2>{item.name_ar}</h2>
          <span>{projectName}</span>
        </div>
      </header>

      <div className="contracts-toolbar">
        {item.can_create ? (
          <Link href={`/dashboard/${item.slug}?mode=new`} className="contracts-primary-link">
            <PlusCircle size={18} />
            عقد جديد
          </Link>
        ) : null}
        {homeSlug ? (
          <Link href={`/dashboard/${homeSlug}`} className="contracts-secondary-link">
            <Home size={18} />
            القائمة الرئيسية
          </Link>
        ) : null}
      </div>

      <section className="contracts-card">
        <div className="contracts-table" role="table" aria-label="قائمة العقود">
          <div className="contracts-table-head" role="row">
            <span role="columnheader">رقم العقد</span>
            <span role="columnheader">اسم العقد</span>
            <span role="columnheader">تاريخ البداية</span>
            <span role="columnheader">تاريخ النهاية</span>
            <span role="columnheader">الحالة</span>
            <span role="columnheader">عدد أوامر العمل</span>
            <span role="columnheader">المنطقة</span>
            <span role="columnheader">الإجراءات</span>
          </div>

          {contractRows.map((contract) => (
            <div className="contracts-table-row" role="row" key={contract.id}>
              <span role="cell" className="contracts-no">
                {contract.contractNo}
              </span>
              <span role="cell" className="contracts-name">
                {contract.contractName}
              </span>
              <span role="cell">{contract.startDate}</span>
              <span role="cell">{contract.endDate}</span>
              <span role="cell">
                <i className={`contract-status is-${contract.status}`}>{contract.status}</i>
              </span>
              <span role="cell">{contract.workOrderCount}</span>
              <span role="cell">{contract.regionName}</span>
              <span role="cell">
                <div className="contracts-actions">
                  <Link href={`/dashboard/${item.slug}?contract=${contract.id}`} className="contracts-icon-link" aria-label={`عرض ${contract.contractName}`}>
                    <Eye size={16} />
                  </Link>
                  {item.can_update ? (
                    <Link
                      href={`/dashboard/${item.slug}?mode=new&contract=${contract.id}`}
                      className="contracts-icon-link contracts-icon-link-edit"
                      aria-label={`تعديل ${contract.contractName}`}
                    >
                      <Pencil size={16} />
                    </Link>
                  ) : null}
                </div>
              </span>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}

function ContractFormPage({
  item,
  homeSlug,
  projectName,
  regionName,
  selectedContract
}: {
  item: MenuRow;
  homeSlug?: string;
  projectName: string;
  regionName: string;
  selectedContract?: ContractRecord;
}) {
  const formTitle = selectedContract ? "تحديث بيانات العقد" : "إضافة عقد جديد";

  return (
    <section className="contracts-page" aria-label={formTitle}>
      <header className="contracts-header">
        <div>
          <p>نموذج عقد خاص بالمشروع الحالي فقط</p>
          <h2>{formTitle}</h2>
          <span>{projectName}</span>
        </div>
      </header>

      <div className="contracts-toolbar">
        <Link href={`/dashboard/${item.slug}`} className="contracts-secondary-link">
          <FileText size={18} />
          العودة إلى العقود
        </Link>
        {homeSlug ? (
          <Link href={`/dashboard/${homeSlug}`} className="contracts-secondary-link">
            <Home size={18} />
            القائمة الرئيسية
          </Link>
        ) : null}
      </div>

      <section className="contracts-card contract-form-card">
        <form className="contract-form-grid">
          <div className="contract-field">
            <label htmlFor="contractNo">رقم العقد *</label>
            <input id="contractNo" name="contractNo" defaultValue={selectedContract?.contractNo ?? ""} />
          </div>

          <div className="contract-field">
            <label htmlFor="contractRegion">المنطقة *</label>
            <select id="contractRegion" name="contractRegion" defaultValue={regionName}>
              <option value={regionName}>{regionName}</option>
            </select>
          </div>

          <div className="contract-field">
            <label htmlFor="contractName">اسم العقد *</label>
            <input id="contractName" name="contractName" defaultValue={selectedContract?.contractName ?? ""} />
          </div>

          <div className="contract-field">
            <label htmlFor="contractStartDate">تاريخ البداية *</label>
            <div className="contract-date-wrap">
              <input id="contractStartDate" name="contractStartDate" type="date" defaultValue={selectedContract?.startDate ?? ""} />
              <CalendarDays size={18} />
            </div>
          </div>

          <div className="contract-field">
            <label htmlFor="contractEndDate">تاريخ النهاية *</label>
            <div className="contract-date-wrap">
              <input id="contractEndDate" name="contractEndDate" type="date" defaultValue={selectedContract?.endDate ?? ""} />
              <CalendarDays size={18} />
            </div>
          </div>

          <div className="contract-field">
            <label htmlFor="contractStatus">الحالة *</label>
            <select id="contractStatus" name="contractStatus" defaultValue={selectedContract?.status ?? "نشط"}>
              <option value="نشط">نشط</option>
              <option value="معلق">معلق</option>
              <option value="منتهي">منتهي</option>
            </select>
          </div>

          <div className="contract-field contract-field-full">
            <label htmlFor="contractFile">ملف العقد (PDF)</label>
            <input id="contractFile" name="contractFile" type="file" accept=".pdf" />
          </div>

          <div className="contract-field contract-field-full">
            <label htmlFor="contractNotes">ملاحظات</label>
            <textarea
              id="contractNotes"
              name="contractNotes"
              rows={6}
              defaultValue={selectedContract?.notes ?? `هذا العقد مرتبط بالمشروع ${projectName} ضمن نطاق ${regionName}.`}
            />
          </div>

          <div className="contract-form-actions">
            <Link href={`/dashboard/${item.slug}`} className="contracts-cancel-link">
              <XCircle size={18} />
              إلغاء
            </Link>
            <button type="button" className="contracts-primary-link">
              <Save size={18} />
              حفظ
            </button>
          </div>
        </form>
      </section>
    </section>
  );
}

function TaskBasketHome({
  basketTitle,
  projectName,
  cards,
  rootSlug
}: {
  basketTitle: string;
  projectName: string;
  cards: TaskBasketCard[];
  rootSlug: string;
}) {
  return (
    <section className="task-basket-page" aria-label={basketTitle}>
      <header className="task-basket-hero">
        <div>
          <p>{basketTitle}</p>
          <h2>{projectName}</h2>
          <span>اختر البطاقة التي تريد فتحها من سلة المهام الحالية</span>
        </div>
      </header>

      <div className="task-basket-grid">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              href={`/dashboard/${rootSlug}/${card.view}`}
              className={`task-basket-card task-${card.tone}`}
              key={card.view}
            >
              <span className="task-basket-count-badge">{card.count}</span>
              <Icon size={54} />
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function TaskBasketDetail({
  basketTitle,
  projectName,
  view,
  rootSlug,
  count
}: {
  basketTitle: string;
  projectName: string;
  view: TaskBasketView;
  rootSlug: string;
  count: number;
}) {
  const detailMeta =
    view === "work-orders"
      ? {
          title: "مهام أوامر العمل",
          description: "خطوات العمل التي تنتظر إجراءك الآن",
          emptyState: "لا توجد مهام أوامر عمل حالية."
        }
      : {
          title: "اعتماد الإجازات",
          description: "طلبات الإجازات التي تنتظر موافقتك",
          emptyState: "لا توجد طلبات إجازات تنتظر الاعتماد."
        };

  return (
    <section className="task-basket-detail" aria-label={detailMeta.title}>
      <header className="task-basket-detail-hero">
        <div>
          <p>{basketTitle}</p>
          <h2>{detailMeta.title}</h2>
          <span>{projectName}</span>
        </div>
        <Link href={`/dashboard/${rootSlug}`} className="task-basket-back-link">
          العودة إلى سلة المهام
        </Link>
      </header>

      <section className="task-basket-summary-card">
        <div>
          <strong>{count}</strong>
          <span>{detailMeta.description}</span>
        </div>
      </section>

      <section className="task-basket-list-card">
        <header>
          <h3>{detailMeta.title}</h3>
          <p>{detailMeta.description}</p>
        </header>

        {count > 0 ? (
          <div className="task-basket-table" role="table" aria-label={detailMeta.title}>
            <div role="row" className="task-basket-table-head">
              <span role="columnheader">المرجع</span>
              <span role="columnheader">الوصف</span>
              <span role="columnheader">الحالة</span>
            </div>
            {Array.from({ length: count }, (_, index) => {
              const ref = view === "work-orders" ? `WO-${1044 + index}` : `LV-${200 + index}`;
              return (
                <div role="row" className="task-basket-table-row" key={ref}>
                  <span role="cell">{ref}</span>
                  <span role="cell">{view === "work-orders" ? "أمر عمل بانتظار المراجعة" : "طلب إجازة بانتظار الاعتماد"}</span>
                  <span role="cell">{view === "work-orders" ? "قيد المراجعة" : "بانتظار الاعتماد"}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="task-basket-empty">{detailMeta.emptyState}</div>
        )}
      </section>
    </section>
  );
}
function ProjectHomeDashboard({ projectName }: { projectName: string }) {
  const operationalCards = [
    { title: "إجمالي الموظفين", value: 0, detail: "سعودي: 0", subDetail: "غير سعودي: 0", icon: Users, tone: "blue" },
    { title: "مهن الموظفين", value: 0, detail: "اضغط لعرض التفاصيل", subDetail: "", icon: BriefcaseBusiness, tone: "violet" },
    { title: "أوامر تحت التنفيذ", value: 4, detail: "قيد المتابعة", subDetail: "", icon: Clock3, tone: "green" },
    { title: "أوامر جديدة", value: 1, detail: "بانتظار الإجراء", subDetail: "", icon: FolderKanban, tone: "cyan" },
    { title: "تم التنفيذ", value: 2, detail: "أوامر مكتملة", subDetail: "", icon: CheckCircle2, tone: "gold" },
    { title: "أوامر منتهية", value: 4, detail: "مغلقة", subDetail: "", icon: ShieldCheck, tone: "slate" }
  ];

  return (
    <section className="project-home-dashboard" aria-label={`إحصائيات ${projectName}`}>
      <header className="section-title-row">
        <div>
          <h3>الرئيسية</h3>
          <p>إحصائيات المشروع الحالي فقط: {projectName}</p>
        </div>
      </header>

      <div className="dashboard-insights">
        {operationalCards.map((card) => {
          const Icon = card.icon;
          return (
            <article className={`insight-card insight-${card.tone}`} key={card.title}>
              <div className="insight-card-header">
                <span>{card.value}</span>
                <h3>
                  <Icon size={21} />
                  {card.title}
                </h3>
              </div>
              <div className="insight-card-body">
                <strong>{card.detail}</strong>
                {card.subDetail ? <strong>{card.subDetail}</strong> : null}
              </div>
            </article>
          );
        })}
      </div>

      <section className="work-type-section">
        <header className="section-title-row">
          <div>
            <h3>إحصائيات حسب نوع العمل</h3>
            <p>حسب سنة تاريخ الاعتماد</p>
          </div>
          <Droplets size={22} />
        </header>

        <div className="work-type-grid">
          {projectWorkTypeCards.map((card) => {
            const Icon = card.icon;
            return (
              <article className={`work-type-card work-${card.tone}`} key={card.title}>
                <header>
                  <span>{card.percent}</span>
                  <h3>
                    <Icon size={22} />
                    {card.title}
                  </h3>
                </header>
                <strong>{card.total}</strong>
                <p>إجمالي أوامر العمل</p>
                <div className="work-progress" aria-hidden="true">
                  <span style={{ width: card.percent }} />
                </div>
                {[2022, 2023, 2024, 2025].map((year, index) => (
                  <div className="year-row" key={year}>
                    <b>
                      {index === 0
                        ? Math.round(card.total * 0.28)
                        : index === 1
                          ? Math.round(card.total * 0.34)
                          : index === 2
                            ? Math.round(card.total * 0.24)
                            : Math.max(0, card.total - Math.round(card.total * 0.86))}
                    </b>
                    <span>
                      <i style={{ width: `${Math.min(96, 30 + index * 16)}%` }} />
                    </span>
                    <em>{year}</em>
                  </div>
                ))}
                <footer>
                  <div>
                    <b>{card.done}</b>
                    <span>تم الانتهاء</span>
                  </div>
                  <div>
                    <b>{card.executing}</b>
                    <span>تم التنفيذ</span>
                  </div>
                  <div>
                    <b>{card.pending}</b>
                    <span>تحت التنفيذ</span>
                  </div>
                </footer>
              </article>
            );
          })}
        </div>
      </section>

      <section className="region-status-section" aria-label="الوضع الحالي للمشروع">
        <header className="section-title-row">
          <div>
            <h3>الوضع الحالي للمشروع</h3>
            <p>توزيع أوامر العمل حسب الحالة</p>
          </div>
          <PieChart size={22} />
        </header>

        <div className="region-status-grid">
          <article className="status-donut-card">
            <div className="status-donut" aria-label="إجمالي أوامر العمل 1044">
              <div>
                <strong>1,044</strong>
                <span>إجمالي</span>
              </div>
            </div>
          </article>

          <div className="status-legend">
            {projectStatusDistribution.map((status) => (
              <div className="status-legend-row" key={status.label}>
                <span style={{ backgroundColor: status.color }} />
                <strong>{status.label}</strong>
              </div>
            ))}
          </div>

          <div className="status-bars">
            {projectStatusDistribution.map((status) => (
              <div className="status-bar-row" key={status.label}>
                <em>{status.percent}%</em>
                <strong>{status.value.toLocaleString("en-US")}</strong>
                <div>
                  <span style={{ width: `${Math.max(status.percent, status.value > 0 ? 4 : 0)}%`, backgroundColor: status.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </section>
  );
}

async function fetchActiveProjects(supabase: Awaited<ReturnType<typeof createClient>>, companyId?: string | null) {
  let query = supabase
    .from("projects")
    .select("id,project_no,name_ar,company_id,project_type,group_no,subgroup_no,region_code,city_code")
    .eq("is_active", true)
    .order("region_code")
    .order("project_no");

  if (companyId) query = query.eq("company_id", companyId);

  const result = await query;
  if (!result.error) return { data: (result.data ?? []) as ProjectRow[], error: null };

  const message = `${result.error.message} ${result.error.details ?? ""}`;
  if (!message.includes("city_code")) return { data: [] as ProjectRow[], error: result.error };

  let fallbackQuery = supabase
    .from("projects")
    .select("id,project_no,name_ar,company_id,project_type,group_no,subgroup_no,region_code")
    .eq("is_active", true)
    .order("region_code")
    .order("project_no");

  if (companyId) fallbackQuery = fallbackQuery.eq("company_id", companyId);

  const fallback = await fallbackQuery;
  return {
    data: ((fallback.data ?? []) as ProjectRow[]).map((project) => ({ ...project, city_code: null })),
    error: fallback.error
  };
}

export default async function MenuPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const supabase = await createClient();
  const currentSlug = slug.at(-1);
  const detailSlug = slug.find((segment) => segment === "work-orders" || segment === "leave-approvals") as
    | TaskBasketView
    | undefined;
  const contractMode = resolvedSearchParams.mode === "new" ? "new" : "list";
  const requestedContractId =
    typeof resolvedSearchParams.contract === "string"
      ? resolvedSearchParams.contract
      : Array.isArray(resolvedSearchParams.contract)
        ? resolvedSearchParams.contract[0]
        : undefined;

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user || !currentSlug) {
    notFound();
  }

  const [{ data: profile }, { data: roleRows }] = await Promise.all([
    supabase
      .from("user_profiles")
      .select("company_id,group_no,subgroup_no,default_project_id")
      .eq("id", authData.user.id)
      .maybeSingle(),
    supabase.from("user_roles").select("roles(id,code)").eq("user_id", authData.user.id)
  ]);

  const roles = (roleRows ?? []).map((row: any) => (Array.isArray(row.roles) ? row.roles[0] : row.roles)).filter(Boolean);
  const roleIds = (roleRows ?? []).map(readRoleId).filter(Boolean) as string[];
  const isSuperAdmin = roles.some((role: any) => role.code === "super_admin");

  if (!roleIds.length) {
    notFound();
  }

  const { data: permissions } = await supabase
    .from("role_menu_permissions")
    .select(
      "can_create,can_update,can_delete,can_approve,menu_items(id,wbs_code,parent_wbs_code,slug,name_ar,name_en,full_path_ar,level,sort_order,group_no,subgroup_no,requires_project)"
    )
    .eq("can_view", true)
    .in("role_id", roleIds);

  const unique = new Map<string, MenuRow & { can_create?: boolean; can_update?: boolean; can_delete?: boolean; can_approve?: boolean }>();

  for (const permission of permissions ?? []) {
    const items = Array.isArray((permission as any).menu_items)
      ? (permission as any).menu_items
      : [(permission as any).menu_items];

    for (const item of items.filter(Boolean)) {
      const groupMatches = isSuperAdmin || item.group_no === 0 || !profile?.group_no || item.group_no === profile.group_no;
      const subgroupMatches =
        isSuperAdmin || item.subgroup_no === null || !profile?.subgroup_no || item.subgroup_no === profile.subgroup_no;
      const projectMatches = isSuperAdmin || !item.requires_project || Boolean(profile?.default_project_id);

      if (!groupMatches || !subgroupMatches || !projectMatches) continue;

      const existing = unique.get(item.wbs_code);
      unique.set(item.wbs_code, {
        ...item,
        can_view: true,
        can_create: Boolean(existing?.can_create || (permission as any).can_create),
        can_update: Boolean(existing?.can_update || (permission as any).can_update),
        can_delete: Boolean(existing?.can_delete || (permission as any).can_delete),
        can_approve: Boolean(existing?.can_approve || (permission as any).can_approve)
      });
    }
  }

  const byCode = new Map(unique);

  function hasAllowedAncestors(row: MenuRow) {
    let parentCode = row.parent_wbs_code;
    while (parentCode) {
      const parent = byCode.get(parentCode);
      if (!parent) return false;
      parentCode = parent.parent_wbs_code;
    }
    return true;
  }

  const allowedItems = Array.from(unique.values()).filter(hasAllowedAncestors);
  const hasProjectRoot = allowedItems.some((row) => row.wbs_code === "0.1.1" || row.wbs_code === "0.1.2.1" || row.wbs_code === "0.1.2.2");
  let projectRows: ProjectRow[] = [];
  let catalogRegions: CatalogRegion[] = [];
  let companies: Array<{ id: string; name_ar: string }> = [];

  if (hasProjectRoot) {
    const [{ data: projects, error: projectsError }, { data: companyRows }, { data: regionRows }] = await Promise.all([
      fetchActiveProjects(supabase, !isSuperAdmin ? profile?.company_id : null),
      supabase.from("companies").select("id,name_ar").order("group_no"),
      supabase
        .from("menu_items")
        .select("wbs_code,name_ar,sort_order")
        .like("wbs_code", "catalog.regions.%")
        .eq("is_active", true)
        .order("sort_order")
    ]);

    if (projectsError) {
      notFound();
    }

    projectRows = projects ?? [];
    catalogRegions = (regionRows ?? []) as CatalogRegion[];
    companies = companyRows ?? [];
  }

  const { syntheticRows, transformedRootCodes } = buildProjectMenuRows({
    baseRows: allowedItems,
    projects: projectRows,
    catalogRegions
  });
  const searchableItems = [...removeTransformedProjectDescendants(allowedItems, transformedRootCodes), ...syntheticRows];
  const item = searchableItems.find((row) => row.slug === currentSlug);

  if (!item) {
    notFound();
  }

  const electricalRegions: RegionCard[] = catalogRegions.map((region) => {
    const code = region.wbs_code.replace("catalog.regions.", "");
    return {
      code,
      name: region.name_ar,
      count: projectRows.filter((project) => projectMatchesConfig(project, { rootCode: "0.1.1", slugPrefix: "electrical", kind: "electrical" }) && (project.region_code || "0") === code).length
    };
  });
  const isProjectHome = item.slug.endsWith("-home") && item.name_ar === "الرئيسية";
  const isTaskBasketRoot = item.wbs_code.endsWith(".6") && item.parent_wbs_code?.endsWith(".home");
  const isContractsPage = item.wbs_code.endsWith(".9.1.1");
  const currentProjectName = projectContextName(item.full_path_ar, "الرئيسية");
  const { regionName: currentRegionName } = readProjectContext(item.full_path_ar);
  const projectHomeRow = findProjectHomeRow(searchableItems, item);
  const contractRows = isContractsPage ? buildProjectContracts(currentProjectName, currentRegionName) : [];
  const selectedContract = contractRows.find((contract) => contract.id === requestedContractId);
  const taskBasketCards: TaskBasketCard[] = [
    {
      view: "work-orders",
      title: "مهام أوامر العمل",
      description: "خطوات العمل التي تنتظر إجراءك",
      count: 1,
      icon: FolderKanban,
      tone: "violet"
    },
    {
      view: "leave-approvals",
      title: "اعتماد الإجازات",
      description: "الطلبات التي تنتظر موافقتك",
      count: 0,
      icon: CheckCircle2,
      tone: "gold"
    }
  ];

  if (isTaskBasketRoot) {
    return (
      <main className="content-page">
        {detailSlug ? (
          <TaskBasketDetail
            basketTitle="سلة المهام"
            projectName={currentProjectName}
            view={detailSlug}
            rootSlug={item.slug}
            count={taskBasketCards.find((card) => card.view === detailSlug)?.count ?? 0}
          />
        ) : (
          <TaskBasketHome basketTitle="سلة المهام" projectName={currentProjectName} cards={taskBasketCards} rootSlug={item.slug} />
        )}
      </main>
    );
  }

  if (isContractsPage) {
    return (
      <main className="content-page">
        {contractMode === "new" ? (
          <ContractFormPage
            item={item}
            homeSlug={projectHomeRow?.slug}
            projectName={currentProjectName}
            regionName={currentRegionName}
            selectedContract={selectedContract}
          />
        ) : (
          <ContractsPage item={item} homeSlug={projectHomeRow?.slug} contractRows={contractRows} projectName={currentProjectName} />
        )}
      </main>
    );
  }

  return (
    <main className="content-page">
      <header className="page-header">
        <p>{item.wbs_code}</p>
        <h2>{item.name_ar}</h2>
        <span>{item.full_path_ar}</span>
      </header>

      <section className="module-panel">
        <h3>صلاحياتك في هذه الشاشة</h3>
        <div className="permission-row">
          <span className={item.can_create ? "allowed" : ""}>إضافة</span>
          <span className={item.can_update ? "allowed" : ""}>تعديل</span>
          <span className={item.can_delete ? "allowed" : ""}>حذف</span>
          <span className={item.can_approve ? "allowed" : ""}>اعتماد</span>
        </div>
      </section>

      {item.slug === "electrical-projects" ? <ElectricalProjectsClient companies={companies} regions={electricalRegions} /> : null}
      {item.slug.startsWith("menu-0-1-1-9-3-1") ? <RegionsManagerClient /> : null}
      {isProjectHome ? <ProjectHomeDashboard projectName={currentProjectName} /> : null}
    </main>
  );
}
