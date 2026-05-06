import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { MenuRow } from "@/lib/erp/types";
import ElectricalProjectsClient from "./ElectricalProjectsClient";

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
      "can_create,can_update,can_delete,can_approve,menu_items(id,wbs_code,parent_wbs_code,slug,name_ar,full_path_ar,level,sort_order,group_no,subgroup_no,requires_project)"
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

  let electricalRegions: RegionCard[] = [];
  const allowedItems = Array.from(unique.values()).filter(hasAllowedAncestors);
  const electricalRoot = allowedItems.find((row) => row.wbs_code === "0.1.1");
  const electricalTemplates = allowedItems.filter((row) => row.parent_wbs_code === "0.1.1");
  let electricalProjects: any[] = [];
  let companies: Array<{ id: string; name_ar: string }> = [];

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

    const [{ data: projectRows }, { data: companyRows }] = await Promise.all([
      projectsQuery,
      supabase.from("companies").select("id,name_ar").order("group_no")
    ]);

    electricalProjects = projectRows ?? [];
    companies = companyRows ?? [];

    const groupedRegions = new Map<string, RegionCard>();

    for (const project of electricalProjects) {
      const code = (project as any).region_code || "0";
      const current = groupedRegions.get(code) ?? { code, name: regionName(code), count: 0 };
      current.count += 1;
      groupedRegions.set(code, current);
    }

    electricalRegions = Array.from(groupedRegions.values()).sort((a, b) => a.name.localeCompare(b.name, "ar"));
  }

  let item = allowedItems.find((row) => row.slug === currentSlug);

  if (!item && electricalRoot) {
    const region = electricalRegions.find((entry) => currentSlug === `electrical-region-${slugPart(entry.code)}`);
    if (region) {
      item = {
        ...electricalRoot,
        id: `electrical-region-${region.code}`,
        wbs_code: `${electricalRoot.wbs_code}.region`,
        parent_wbs_code: electricalRoot.wbs_code,
        name_ar: region.name,
        name_en: null,
        slug: currentSlug,
        full_path_ar: `${electricalRoot.full_path_ar} > ${region.name}`,
        level: electricalRoot.level + 1,
        requires_project: false
      };
    }
  }

  if (!item && electricalRoot) {
    const project = electricalProjects.find((row) => currentSlug === `electrical-project-${slugPart(row.project_no || row.name_ar)}`);
    if (project) {
      const regionLabel = regionName(project.region_code);
      const projectNo = project.project_no || project.name_ar;
      item = {
        ...electricalRoot,
        id: `electrical-project-${project.id}`,
        wbs_code: `${electricalRoot.wbs_code}.project`,
        parent_wbs_code: `${electricalRoot.wbs_code}.region`,
        name_ar: projectNo,
        name_en: null,
        slug: currentSlug,
        full_path_ar: `${electricalRoot.full_path_ar} > ${regionLabel} > ${projectNo}`,
        level: electricalRoot.level + 2,
        requires_project: true
      };
    }
  }

  if (!item && electricalRoot && currentSlug.includes("-project-")) {
    const marker = "-project-";
    const markerIndex = currentSlug.indexOf(marker);
    const baseSlug = currentSlug.slice(0, markerIndex);
    const projectPart = currentSlug.slice(markerIndex + marker.length);
    const template = electricalTemplates.find((row) => row.slug === baseSlug);
    const project = electricalProjects.find((row) => slugPart(row.project_no || row.name_ar) === projectPart);

    if (template && project) {
      const regionLabel = regionName(project.region_code);
      const projectNo = project.project_no || project.name_ar;
      item = {
        ...template,
        id: `${template.id}-${project.id}`,
        wbs_code: `${electricalRoot.wbs_code}.project.${template.wbs_code}`,
        parent_wbs_code: `${electricalRoot.wbs_code}.project`,
        slug: currentSlug,
        full_path_ar: `${electricalRoot.full_path_ar} > ${regionLabel} > ${projectNo} > ${template.name_ar}`,
        level: electricalRoot.level + 3
      };
    }
  }

  if (!item) {
    notFound();
  }

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

      {item.slug === "electrical-projects" ? (
        <ElectricalProjectsClient companies={companies} regions={electricalRegions} />
      ) : null}
    </main>
  );
}
