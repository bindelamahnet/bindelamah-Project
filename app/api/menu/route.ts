import { NextResponse } from "next/server";
import { buildMenuTree } from "@/lib/erp/menu";
import type { MenuRow } from "@/lib/erp/types";
import { createClient } from "@/lib/supabase/server";

function regionName(code: string | null | undefined) {
  const labels: Record<string, string> = {
    "0": "غير محدد",
    jazan: "جازان",
    makkah: "مكة المكرمة",
    riyadh: "الرياض",
    eastern: "المنطقة الشرقية",
    madinah: "المدينة المنورة",
    qassim: "القصيم",
    aseer: "عسير",
    tabuk: "تبوك",
    hail: "حائل",
    northern_borders: "الحدود الشمالية",
    jawf: "الجوف",
    baha: "الباحة",
    najran: "نجران"
  };

  if (!code) return labels["0"];
  return labels[code] ?? code;
}

function slugPart(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06ff]+/gi, "-")
    .replace(/^-+|-+$/g, "") || "item";
}

export async function GET() {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("company_id,group_no,subgroup_no,default_project_id")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  const { data: roleRows, error: rolesError } = await supabase
    .from("user_roles")
    .select("roles(code)")
    .eq("user_id", authData.user.id);

  if (rolesError) {
    return NextResponse.json({ error: rolesError.message }, { status: 500 });
  }

  const isSuperAdmin = (roleRows ?? []).some((row: any) => {
    const roles = Array.isArray(row.roles) ? row.roles : [row.roles];
    return roles.some((role: any) => role?.code === "super_admin");
  });

  const { data, error } = await supabase
    .from("role_menu_permissions")
    .select(
      "can_view,can_create,can_update,can_delete,can_approve,menu_items(id,wbs_code,parent_wbs_code,name_ar,name_en,slug,full_path_ar,level,sort_order,group_no,subgroup_no,requires_project)"
    )
    .eq("can_view", true);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const unique = new Map<string, MenuRow>();

  for (const permission of data ?? []) {
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

  const rows = Array.from(unique.values());
  const byCode = new Map(rows.map((row) => [row.wbs_code, row]));

  function hasAllowedAncestors(row: MenuRow) {
    let parentCode = row.parent_wbs_code;
    while (parentCode) {
      const parent = byCode.get(parentCode);
      if (!parent) return false;
      parentCode = parent.parent_wbs_code;
    }
    return true;
  }

  const withAncestors = rows.filter(hasAllowedAncestors);

  let finalRows = withAncestors;
  const electricalRoot = withAncestors.find((row) => row.wbs_code === "0.1.1");
  const electricalTemplates = withAncestors
    .filter((row) => row.parent_wbs_code === "0.1.1")
    .sort((a, b) => a.sort_order - b.sort_order || a.wbs_code.localeCompare(b.wbs_code));

  if (electricalRoot) {
    let projectsQuery = supabase
      .from("projects")
      .select("id,project_no,name_ar,company_id,region_code")
      .eq("is_active", true)
      .eq("project_type", "electrical")
      .order("region_code")
      .order("project_no");

    if (!isSuperAdmin && profile?.company_id) {
      projectsQuery = projectsQuery.eq("company_id", profile.company_id);
    }

    const { data: electricalProjects, error: projectsError } = await projectsQuery;

    if (projectsError) {
      return NextResponse.json({ error: projectsError.message }, { status: 500 });
    }

    const syntheticRows: MenuRow[] = [];
    const regions = new Map<string, { code: string; name: string; projects: any[] }>();

    for (const project of electricalProjects ?? []) {
      const code = (project as any).region_code || "0";
      const current = regions.get(code) ?? { code, name: regionName(code), projects: [] as any[] };
      current.projects.push(project);
      regions.set(code, current);
    }

    Array.from(regions.values())
      .sort((a, b) => a.name.localeCompare(b.name, "ar"))
      .forEach((region, regionIndex) => {
        const regionCode = `0.1.1.r${regionIndex + 1}`;
        const regionSlug = `electrical-region-${slugPart(region.code)}`;
        const regionPath = `${electricalRoot.full_path_ar} > ${region.name}`;

        syntheticRows.push({
          ...electricalRoot,
          id: `electrical-region-${region.code}`,
          wbs_code: regionCode,
          parent_wbs_code: electricalRoot.wbs_code,
          name_ar: region.name,
          name_en: null,
          slug: regionSlug,
          full_path_ar: regionPath,
          level: electricalRoot.level + 1,
          sort_order: electricalRoot.sort_order * 1000 + regionIndex + 1,
          requires_project: false
        });

        region.projects.forEach((project, projectIndex) => {
          const projectNo = (project as any).project_no || (project as any).name_ar || `project-${projectIndex + 1}`;
          const projectCode = `${regionCode}.p${projectIndex + 1}`;
          const projectSlug = `electrical-project-${slugPart(projectNo)}`;
          const projectPath = `${regionPath} > ${projectNo}`;

          syntheticRows.push({
            ...electricalRoot,
            id: `electrical-project-${(project as any).id}`,
            wbs_code: projectCode,
            parent_wbs_code: regionCode,
            name_ar: projectNo,
            name_en: null,
            slug: projectSlug,
            full_path_ar: projectPath,
            level: electricalRoot.level + 2,
            sort_order: electricalRoot.sort_order * 1000 + (regionIndex + 1) * 100 + projectIndex + 1,
            requires_project: true
          });

          electricalTemplates.forEach((template, templateIndex) => {
            const templateSuffix = template.wbs_code.replace("0.1.1.", "");
            syntheticRows.push({
              ...template,
              id: `${template.id}-${(project as any).id}`,
              wbs_code: `${projectCode}.${templateSuffix}`,
              parent_wbs_code: projectCode,
              slug: `${template.slug}-project-${slugPart(projectNo)}`,
              full_path_ar: `${projectPath} > ${template.name_ar}`,
              level: electricalRoot.level + 3,
              sort_order:
                electricalRoot.sort_order * 1000 + (regionIndex + 1) * 100 + (projectIndex + 1) * 10 + templateIndex + 1
            });
          });
        });
      });

    finalRows = [
      ...withAncestors.filter((row) => row.parent_wbs_code !== "0.1.1" && !row.wbs_code.startsWith("0.1.1.")),
      ...syntheticRows
    ];
  }

  return NextResponse.json({ menu: buildMenuTree(finalRows) });
}
