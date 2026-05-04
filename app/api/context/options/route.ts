import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const [{ data: companies, error: companiesError }, { data: projects, error: projectsError }] =
    await Promise.all([
      supabase.from("companies").select("id,name_ar,name_en,group_no").order("group_no"),
      supabase
        .from("projects")
        .select("id,company_id,project_no,name_ar,project_type,group_no,subgroup_no,region_code")
        .eq("is_active", true)
        .order("group_no")
        .order("subgroup_no")
    ]);

  const error = companiesError ?? projectsError;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ companies: companies ?? [], projects: projects ?? [] });
}
