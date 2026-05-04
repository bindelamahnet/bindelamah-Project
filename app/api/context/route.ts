import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("full_name,company_id,default_project_id,group_no,subgroup_no,region_code")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  const { data: roleRows, error: rolesError } = await supabase
    .from("user_roles")
    .select("roles(id,code,name_ar)")
    .eq("user_id", authData.user.id);

  if (rolesError) {
    return NextResponse.json({ error: rolesError.message }, { status: 500 });
  }

  const roles = (roleRows ?? [])
    .map((row: any) => row.roles)
    .flat()
    .filter(Boolean);

  return NextResponse.json({
    user: { id: authData.user.id, email: authData.user.email ?? null },
    profile,
    roles
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const companyId = typeof body.company_id === "string" && body.company_id ? body.company_id : null;
  const projectId = typeof body.project_id === "string" && body.project_id ? body.project_id : null;

  const { error } = await supabase
    .from("user_profiles")
    .update({
      company_id: companyId,
      default_project_id: projectId
    })
    .eq("id", authData.user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
