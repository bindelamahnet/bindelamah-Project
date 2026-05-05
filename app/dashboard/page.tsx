import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const [
    { data: context },
    { count: companyCount },
    { count: totalProjectsCount },
    { count: electricalProjectsCount },
    { count: waterProjectsCount },
    { count: menuCount },
    { count: roleCount }
  ] = await Promise.all([
    supabase.from("user_profiles").select("full_name,company_id,default_project_id").maybeSingle(),
    supabase.from("companies").select("id", { count: "exact", head: true }),
    supabase.from("projects").select("id", { count: "exact", head: true }),
    supabase.from("projects").select("id", { count: "exact", head: true }).eq("project_type", "electrical"),
    supabase.from("projects").select("id", { count: "exact", head: true }).ilike("project_no", "WATER-%"),
    supabase.from("menu_items").select("id", { count: "exact", head: true }),
    supabase.from("roles").select("id", { count: "exact", head: true })
  ]);

  const otherProjectsCount = Math.max(
    0,
    (totalProjectsCount ?? 0) - (electricalProjectsCount ?? 0) - (waterProjectsCount ?? 0)
  );

  return (
    <main className="content-page">
      <header className="page-header">
        <p>لوحة التحكم</p>
        <h2>نظام BDCC ERP جاهز للعمل</h2>
      </header>

      <section className="stats-grid" aria-label="ملخص النظام">
        <div className="stat-card">
          <span>{companyCount ?? 0}</span>
          <p>مجموعة شركات بن دلامة</p>
        </div>
        <div className="stat-card">
          <span>{electricalProjectsCount ?? 0}</span>
          <p>مشاريع الكهرباء</p>
        </div>
        <div className="stat-card">
          <span>{waterProjectsCount ?? 0}</span>
          <p>مشاريع المياه</p>
        </div>
        <div className="stat-card">
          <span>{otherProjectsCount}</span>
          <p>المشاريع الأخرى</p>
        </div>
        <div className="stat-card">
          <span>{menuCount ?? 0}</span>
          <p>عنصر في القائمة</p>
        </div>
        <div className="stat-card">
          <span>{roleCount ?? 0}</span>
          <p>أدوار معرفة</p>
        </div>
        <div className="stat-card">
          <span>{context?.default_project_id ? "محدد" : "عام"}</span>
          <p>سياق المشروع</p>
        </div>
      </section>
    </main>
  );
}
