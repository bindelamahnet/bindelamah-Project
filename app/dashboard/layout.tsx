import { redirect } from "next/navigation";
import DashboardTopbar from "@/components/DashboardTopbar";
import Sidebar from "@/components/Sidebar";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  const [{ data: profile }, { data: roleRows }] = await Promise.all([
    supabase.from("user_profiles").select("full_name").eq("id", data.user.id).maybeSingle(),
    supabase.from("user_roles").select("roles(name_ar)").eq("user_id", data.user.id)
  ]);

  const firstRole = (roleRows ?? [])
    .map((row: any) => (Array.isArray(row.roles) ? row.roles[0] : row.roles))
    .find(Boolean);
  const userName = profile?.full_name || data.user.email?.split("@")[0] || "مدير النظام";
  const jobTitle = firstRole?.name_ar || "مدير النظام";

  return (
    <div className="dashboard-shell">
      <Sidebar />
      <div className="dashboard-main">
        <DashboardTopbar userName={userName} jobTitle={jobTitle} />
        {children}
      </div>
    </div>
  );
}
