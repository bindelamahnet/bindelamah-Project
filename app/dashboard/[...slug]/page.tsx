import { notFound } from "next/navigation";
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
};

type RegionCard = {
  code: string;
  name: string;
  count: number;
};

function readRoleId(row: any) {
  const role = Array.isArray(row.roles) ? row.roles[0] : row.roles;
  return role?.id as string | undefined;
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

export default async function MenuPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const currentSlug = slug.at(-1);

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
    </main>
  );
}
