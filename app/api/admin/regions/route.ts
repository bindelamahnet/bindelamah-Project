import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function slugPart(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06ff]+/gi, "-")
      .replace(/^-+|-+$/g, "") || "region"
  );
}

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

async function listRegions(admin: ReturnType<typeof createAdminClient>) {
  const [{ data: regions, error: regionsError }, { data: projects, error: projectsError }] = await Promise.all([
    admin
      .from("menu_items")
      .select("id,wbs_code,name_ar,sort_order,is_active")
      .like("wbs_code", "catalog.regions.%")
      .eq("is_active", true)
      .order("sort_order"),
    admin.from("projects").select("region_code").eq("project_type", "electrical").eq("is_active", true)
  ]);

  if (regionsError) throw regionsError;
  if (projectsError) throw projectsError;

  const counts = new Map<string, number>();
  for (const project of projects ?? []) {
    const code = (project as any).region_code || "0";
    counts.set(code, (counts.get(code) ?? 0) + 1);
  }

  return (regions ?? []).map((region: any, index) => {
    const code = region.wbs_code.replace("catalog.regions.", "");
    return {
      index: index + 1,
      id: region.id,
      code,
      name_ar: region.name_ar,
      project_count: counts.get(code) ?? 0
    };
  });
}

export async function GET() {
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

  try {
    return NextResponse.json({ regions: await listRegions(admin) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "تعذر تحميل المناطق." }, { status: 500 });
  }
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
  const nameAr = typeof body.name_ar === "string" ? body.name_ar.trim() : "";
  const code = typeof body.code === "string" && body.code.trim() ? slugPart(body.code) : slugPart(nameAr);

  if (!nameAr) {
    return NextResponse.json({ error: "اسم المنطقة مطلوب." }, { status: 400 });
  }

  const { count } = await admin.from("menu_items").select("id", { count: "exact", head: true }).like("wbs_code", "catalog.regions.%");

  const { error } = await admin.from("menu_items").upsert(
    {
      wbs_code: `catalog.regions.${code}`,
      parent_wbs_code: null,
      name_ar: nameAr,
      name_en: null,
      slug: `region-catalog-${code}`,
      full_path_ar: `كتالوج المناطق > ${nameAr}`,
      level: 1,
      sort_order: (count ?? 0) * 10 + 10,
      group_no: 0,
      subgroup_no: null,
      requires_project: false,
      is_active: true
    },
    { onConflict: "wbs_code" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, regions: await listRegions(admin) });
}

export async function PUT(request: Request) {
  const access = await requireSuperAdmin();
  if (access.error) return access.error;

  const admin = createAdminClient();
  const body = await request.json();
  const id = typeof body.id === "string" ? body.id : "";
  const nameAr = typeof body.name_ar === "string" ? body.name_ar.trim() : "";

  if (!id || !nameAr) {
    return NextResponse.json({ error: "المنطقة واسمها مطلوبان." }, { status: 400 });
  }

  const { error } = await admin.from("menu_items").update({ name_ar: nameAr, full_path_ar: `كتالوج المناطق > ${nameAr}` }).eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, regions: await listRegions(admin) });
}

export async function DELETE(request: Request) {
  const access = await requireSuperAdmin();
  if (access.error) return access.error;

  const admin = createAdminClient();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const code = searchParams.get("code");

  if (!id || !code) {
    return NextResponse.json({ error: "المنطقة مطلوبة." }, { status: 400 });
  }

  const { count } = await admin
    .from("projects")
    .select("id", { count: "exact", head: true })
    .eq("project_type", "electrical")
    .eq("region_code", code)
    .eq("is_active", true);

  if ((count ?? 0) > 0) {
    return NextResponse.json({ error: "لا يمكن حذف منطقة مرتبطة بمشاريع كهرباء." }, { status: 400 });
  }

  const { error } = await admin.from("menu_items").update({ is_active: false }).eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, regions: await listRegions(admin) });
}
