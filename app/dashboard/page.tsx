import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const [{ data: context }, { count: menuCount }, { count: roleCount }] = await Promise.all([
    supabase.from("user_profiles").select("full_name,company_id,default_project_id").maybeSingle(),
    supabase.from("menu_items").select("id", { count: "exact", head: true }),
    supabase.from("roles").select("id", { count: "exact", head: true })
  ]);

  return (
    <main className="content-page">
      <header className="page-header">
        <p>لوحة التحكم</p>
        <h2>نظام BDCC ERP جاهز للعمل</h2>
      </header>

      <section className="stats-grid" aria-label="ملخص النظام">
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
