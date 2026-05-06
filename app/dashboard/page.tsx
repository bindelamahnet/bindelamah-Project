import {
  Activity,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  Droplets,
  FolderKanban,
  Network,
  PieChart,
  ShieldCheck,
  Users,
  Zap
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

const workTypeCards = [
  { title: "التوصيلات", total: 666, percent: "64%", done: 666, executing: 0, pending: 0, tone: "blue", icon: Zap },
  { title: "مشاريع التوصيلات", total: 84, percent: "8%", done: 84, executing: 0, pending: 0, tone: "teal", icon: Network },
  { title: "المشاريع", total: 108, percent: "10%", done: 102, executing: 2, pending: 4, tone: "violet", icon: FolderKanban },
  { title: "الصيانة والفحص", total: 58, percent: "6%", done: 58, executing: 0, pending: 0, tone: "cyan", icon: ShieldCheck },
  { title: "الطوارئ", total: 126, percent: "12%", done: 126, executing: 0, pending: 0, tone: "red", icon: Activity }
];

const statusDistribution = [
  { label: "جديد", value: 1, percent: 0, color: "#2f80ed" },
  { label: "تحت التنفيذ", value: 4, percent: 0, color: "#18b990" },
  { label: "مرحلة إغلاق", value: 2, percent: 0, color: "#f6a611" },
  { label: "اعتماد مستخلص", value: 1033, percent: 99, color: "#8056f6" },
  { label: "منتهي", value: 4, percent: 0, color: "#f04444" }
];

export default async function DashboardPage() {
  const supabase = await createClient();
  const [
    { data: context },
    { count: companyCount },
    { count: totalProjectsCount },
    { count: electricalProjectsCount },
    { count: waterProjectsCount },
    { count: menuCount },
    { count: roleCount },
    { count: employeesCount }
  ] = await Promise.all([
    supabase.from("user_profiles").select("full_name,company_id,default_project_id").maybeSingle(),
    supabase.from("companies").select("id", { count: "exact", head: true }),
    supabase.from("projects").select("id", { count: "exact", head: true }),
    supabase.from("projects").select("id", { count: "exact", head: true }).eq("project_type", "electrical"),
    supabase.from("projects").select("id", { count: "exact", head: true }).ilike("project_no", "WATER-%"),
    supabase.from("menu_items").select("id", { count: "exact", head: true }),
    supabase.from("roles").select("id", { count: "exact", head: true }),
    supabase.from("user_profiles").select("id", { count: "exact", head: true })
  ]);

  const otherProjectsCount = Math.max(0, (totalProjectsCount ?? 0) - (electricalProjectsCount ?? 0) - (waterProjectsCount ?? 0));

  const summaryCards = [
    { label: "مجموعة شركات بن دلامة", value: companyCount ?? 0 },
    { label: "مشاريع الكهرباء", value: electricalProjectsCount ?? 0 },
    { label: "مشاريع المياه", value: waterProjectsCount ?? 0 },
    { label: "المشاريع الأخرى", value: otherProjectsCount },
    { label: "عنصر في القائمة", value: menuCount ?? 0 },
    { label: "أدوار معرفة", value: roleCount ?? 0 },
    { label: "سياق المشروع", value: context?.default_project_id ? "محدد" : "عام" }
  ];

  const operationalCards = [
    { title: "إجمالي الموظفين", value: employeesCount ?? 0, detail: "سعودي: 0", subDetail: "غير سعودي: 0", icon: Users, tone: "blue" },
    { title: "مهن الموظفين", value: 0, detail: "اضغط لعرض التفاصيل", subDetail: "", icon: BriefcaseBusiness, tone: "violet" },
    { title: "أوامر تحت التنفيذ", value: 4, detail: "قيد المتابعة", subDetail: "", icon: Clock3, tone: "green" },
    { title: "أوامر جديدة", value: 1, detail: "بانتظار الإجراء", subDetail: "", icon: FolderKanban, tone: "cyan" },
    { title: "تم التنفيذ", value: 2, detail: "أوامر مكتملة", subDetail: "", icon: CheckCircle2, tone: "gold" },
    { title: "أوامر منتهية", value: 4, detail: "مغلقة", subDetail: "", icon: ShieldCheck, tone: "slate" },
    { title: "إجمالي الموظفين السعوديين", value: 0, detail: "جاهز للربط ببيانات الجنسية", subDetail: "", icon: Users, tone: "blue" },
    { title: "إجمالي الموظفين غير السعوديين", value: 0, detail: "جاهز للربط ببيانات الجنسية", subDetail: "", icon: Users, tone: "violet" }
  ];

  return (
    <main className="content-page">
      <header className="page-header">
        <p>لوحة التحكم</p>
        <h2>نظام BDCC ERP جاهز للعمل</h2>
      </header>

      <section className="stats-grid" aria-label="ملخص النظام">
        {summaryCards.map((card) => (
          <div className="stat-card" key={card.label}>
            <span>{card.value}</span>
            <p>{card.label}</p>
          </div>
        ))}
      </section>

      <section className="dashboard-insights" aria-label="مؤشرات لوحة التحكم">
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
      </section>

      <section className="work-type-section">
        <header className="section-title-row">
          <div>
            <h3>إحصائيات حسب نوع العمل</h3>
            <p>حسب سنة تاريخ الاعتماد</p>
          </div>
          <Droplets size={22} />
        </header>

        <div className="work-type-grid">
          {workTypeCards.map((card) => {
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
                    <b>{index === 0 ? Math.round(card.total * 0.28) : index === 1 ? Math.round(card.total * 0.34) : index === 2 ? Math.round(card.total * 0.24) : Math.max(0, card.total - Math.round(card.total * 0.86))}</b>
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

      <section className="region-status-section" aria-label="الوضع الحالي للمنطقة">
        <header className="section-title-row">
          <div>
            <h3>الوضع الحالي للمنطقة</h3>
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
            {statusDistribution.map((item) => (
              <div className="status-legend-row" key={item.label}>
                <span style={{ backgroundColor: item.color }} />
                <strong>{item.label}</strong>
              </div>
            ))}
          </div>

          <div className="status-bars">
            {statusDistribution.map((item) => (
              <div className="status-bar-row" key={item.label}>
                <em>{item.percent}%</em>
                <strong>{item.value.toLocaleString("en-US")}</strong>
                <div>
                  <span style={{ width: `${Math.max(item.percent, item.value > 0 ? 4 : 0)}%`, backgroundColor: item.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
