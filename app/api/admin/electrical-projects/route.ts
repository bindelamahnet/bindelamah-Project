import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function requireSuperAdmin() {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const { data: roleRows, error: rolesError } = await supabase
    .from("user_roles")
    .select("roles(code)")
    .eq("user_id", authData.user.id);

  if (rolesError) {
    return { error: NextResponse.json({ error: rolesError.message }, { status: 500 }) };
  }

  const isSuperAdmin = (roleRows ?? []).some((row: any) => {
    const roles = Array.isArray(row.roles) ? row.roles : [row.roles];
    return roles.some((role: any) => role?.code === "super_admin");
  });

  if (!isSuperAdmin) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { user: authData.user };
}

export async function POST(request: Request) {
  const access = await requireSuperAdmin();
  if (access.error) return access.error;

  let admin;
  try {
    admin = createAdminClient();
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Supabase admin credentials are not configured." },
      { status: 503 }
    );
  }

  const body = await request.json();
  const companyId = typeof body.company_id === "string" ? body.company_id.trim() : "";
  const projectNo = typeof body.project_no === "string" ? body.project_no.trim() : "";
  const nameAr = typeof body.name_ar === "string" ? body.name_ar.trim() : "";
  const regionCode = typeof body.region_code === "string" && body.region_code.trim() ? body.region_code.trim() : "0";

  if (!companyId || !projectNo || !nameAr) {
    return NextResponse.json({ error: "الشركة ورقم المشروع واسم المشروع مطلوبة." }, { status: 400 });
  }

  const { data: company, error: companyError } = await admin
    .from("companies")
    .select("id,group_no")
    .eq("id", companyId)
    .maybeSingle();

  if (companyError || !company) {
    return NextResponse.json({ error: companyError?.message ?? "الشركة غير موجودة." }, { status: 400 });
  }

  const { data: existing } = await admin.from("projects").select("id").eq("project_no", projectNo).maybeSingle();
  if (existing) {
    return NextResponse.json({ error: "رقم المشروع موجود مسبقا." }, { status: 400 });
  }

  const { data: project, error: projectError } = await admin
    .from("projects")
    .insert({
      company_id: companyId,
      project_no: projectNo,
      name_ar: nameAr,
      project_type: "electrical",
      group_no: 1,
      subgroup_no: null,
      region_code: regionCode,
      is_active: true
    })
    .select("id")
    .single();

  if (projectError || !project) {
    return NextResponse.json({ error: projectError?.message ?? "تعذر إضافة مشروع الكهرباء." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, project_id: project.id });
}
