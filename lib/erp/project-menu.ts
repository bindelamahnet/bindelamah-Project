import type { MenuRow } from "./types";

export type ProjectMenuConfig = {
  rootCode: string;
  slugPrefix: string;
  kind: "electrical" | "water" | "university";
};

export type ProjectRow = {
  id: string;
  project_no: string | null;
  name_ar: string;
  company_id: string;
  project_type: string;
  group_no: number;
  subgroup_no: number | null;
  region_code: string | null;
  city_code?: string | null;
};

export type CatalogRegion = {
  wbs_code: string;
  name_ar: string;
  sort_order: number;
};

export const PROJECT_MENU_CONFIGS: ProjectMenuConfig[] = [
  { rootCode: "0.1.1", slugPrefix: "electrical", kind: "electrical" },
  { rootCode: "0.1.2.1", slugPrefix: "water", kind: "water" },
  { rootCode: "0.1.2.2", slugPrefix: "university", kind: "university" }
];

const projectHomeOrder = [
  "إدارة الموارد",
  "مدير المشاريع",
  "القسم الفني",
  "موظف سكيكو",
  "إدارة المستودع",
  "إحصائيات",
  "الإدارة",
  "الملف الشخصي"
];

const projectHomeNameOverrides: Record<string, string> = {
  "0.1.1.3": "إدارة الموارد",
  "0.1.1.8": "إحصائيات",
  "0.1.1.10": "الملف الشخصي"
};

function projectHomeDisplayName(template: MenuRow) {
  return projectHomeNameOverrides[template.wbs_code] ?? template.name_ar;
}

function projectHomeSortRank(template: MenuRow) {
  const displayName = projectHomeDisplayName(template);
  const rank = projectHomeOrder.indexOf(displayName);
  return rank === -1 ? projectHomeOrder.length + template.sort_order : rank;
}

function projectHomePathSuffix(template: MenuRow, rootCode: string, rootPath: string) {
  const suffix = template.full_path_ar.replace(`${rootPath} > `, "");
  const topLevelCode = `${rootCode}.${template.wbs_code.replace(`${rootCode}.`, "").split(".")[0]}`;
  const override = projectHomeNameOverrides[topLevelCode];
  if (!override) return suffix;
  const parts = suffix.split(" > ");
  parts[0] = override;
  return parts.join(" > ");
}

const regionLabels: Record<string, string> = {
  "0": "غير محدد",
  riyadh: "الرياض",
  makkah: "مكة المكرمة",
  madinah: "المدينة المنورة",
  eastern: "الشرقية",
  aseer: "عسير",
  qassim: "القصيم",
  tabuk: "تبوك",
  hail: "حائل",
  jawf: "الجوف",
  jazan: "جازان",
  najran: "نجران",
  baha: "الباحة",
  northern_borders: "الحدود الشمالية"
};

const defaultCitiesByRegion: Record<string, { code: string; name: string }> = {
  "0": { code: "0", name: "غير محدد" },
  riyadh: { code: "riyadh", name: "الرياض" },
  makkah: { code: "makkah", name: "مكة المكرمة" },
  madinah: { code: "madinah", name: "المدينة المنورة" },
  eastern: { code: "dammam", name: "الدمام" },
  aseer: { code: "abha", name: "أبها" },
  qassim: { code: "buraydah", name: "بريدة" },
  tabuk: { code: "tabuk", name: "تبوك" },
  hail: { code: "hail", name: "حائل" },
  jawf: { code: "sakaka", name: "سكاكا" },
  jazan: { code: "jazan", name: "جازان" },
  najran: { code: "najran", name: "نجران" },
  baha: { code: "baha", name: "الباحة" },
  northern_borders: { code: "arar", name: "عرعر" }
};

export function regionName(code: string | null | undefined) {
  if (!code) return regionLabels["0"];
  return regionLabels[code] ?? code;
}

export function defaultCityForRegion(regionCode: string | null | undefined) {
  const code = regionCode || "0";
  return defaultCitiesByRegion[code] ?? { code, name: regionName(code) };
}

export function cityName(code: string | null | undefined, regionCode: string | null | undefined) {
  if (!code || code === "0") return defaultCityForRegion(regionCode).name;
  const sameRegionDefault = defaultCityForRegion(regionCode);
  if (sameRegionDefault.code === code) return sameRegionDefault.name;
  return code;
}

export function projectCity(project: ProjectRow) {
  const fallback = defaultCityForRegion(project.region_code);
  const code = project.city_code || fallback.code;
  return { code, name: cityName(code, project.region_code) };
}

export function slugPart(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06ff]+/gi, "-")
      .replace(/^-+|-+$/g, "") || "item"
  );
}

export function projectMatchesConfig(project: ProjectRow, config: ProjectMenuConfig) {
  if (config.kind === "electrical") return project.project_type === "electrical";
  if (config.kind === "water") {
    return (
      project.project_type === "water" ||
      project.project_no?.toUpperCase().startsWith("WATER-") ||
      (project.project_type === "private" && project.group_no === 2 && project.subgroup_no === 1)
    );
  }
  return (
    project.project_type === "university" ||
    project.project_no?.toUpperCase().startsWith("UNIV-") ||
    (project.project_type === "private" && project.group_no === 2 && project.subgroup_no === 2)
  );
}

export function buildProjectMenuRows({
  baseRows,
  projects,
  catalogRegions
}: {
  baseRows: MenuRow[];
  projects: ProjectRow[];
  catalogRegions: CatalogRegion[];
}) {
  const syntheticRows: MenuRow[] = [];
  const transformedRootCodes: string[] = [];

  for (const config of PROJECT_MENU_CONFIGS) {
    const root = baseRows.find((row) => row.wbs_code === config.rootCode);
    if (!root) continue;

    const templates = baseRows
      .filter((row) => row.wbs_code.startsWith(`${config.rootCode}.`) && row.parent_wbs_code)
      .filter((row) => row.parent_wbs_code !== config.rootCode || row.name_ar !== "الرئيسية")
      .sort((a, b) => {
        if (a.parent_wbs_code === config.rootCode && b.parent_wbs_code === config.rootCode) {
          return projectHomeSortRank(a) - projectHomeSortRank(b) || a.sort_order - b.sort_order || a.wbs_code.localeCompare(b.wbs_code);
        }
        return a.sort_order - b.sort_order || a.wbs_code.localeCompare(b.wbs_code);
      });

    const configProjects = projects
      .filter((project) => projectMatchesConfig(project, config))
      .sort((a, b) => {
        const regionCompare = (a.region_code || "0").localeCompare(b.region_code || "0");
        if (regionCompare) return regionCompare;
        return (a.project_no || a.name_ar).localeCompare(b.project_no || b.name_ar, "ar");
      });

    transformedRootCodes.push(config.rootCode);

    const regions = new Map<string, { code: string; name: string; sortOrder: number; projects: ProjectRow[] }>();
    for (const region of catalogRegions) {
      const code = region.wbs_code.replace("catalog.regions.", "");
      regions.set(code, { code, name: region.name_ar, sortOrder: region.sort_order, projects: [] });
    }

    for (const project of configProjects) {
      const code = project.region_code || "0";
      const current = regions.get(code) ?? { code, name: regionName(code), sortOrder: 9999, projects: [] };
      current.projects.push(project);
      regions.set(code, current);
    }

    Array.from(regions.values())
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "ar"))
      .forEach((region, regionIndex) => {
        const regionCode = `${config.rootCode}.r${regionIndex + 1}`;
        const regionSlug = `${config.slugPrefix}-region-${slugPart(region.code)}`;
        const regionPath = `${root.full_path_ar} > ${region.name}`;

        syntheticRows.push({
          ...root,
          id: `${config.slugPrefix}-region-${region.code}`,
          wbs_code: regionCode,
          parent_wbs_code: root.wbs_code,
          name_ar: region.name,
          name_en: null,
          slug: regionSlug,
          full_path_ar: regionPath,
          level: root.level + 1,
          sort_order: root.sort_order * 1000 + regionIndex + 1,
          requires_project: false
        });

        const cities = new Map<string, { code: string; name: string; projects: ProjectRow[] }>();
        for (const project of region.projects) {
          const currentCity = projectCity(project);
          const city = cities.get(currentCity.code) ?? { ...currentCity, projects: [] };
          city.projects.push(project);
          cities.set(currentCity.code, city);
        }

        Array.from(cities.values())
          .sort((a, b) => a.name.localeCompare(b.name, "ar"))
          .forEach((city, cityIndex) => {
            const cityCode = `${regionCode}.c${cityIndex + 1}`;
            const citySlug = `${config.slugPrefix}-city-${slugPart(region.code)}-${slugPart(city.code)}`;
            const cityPath = `${regionPath} > ${city.name}`;

            syntheticRows.push({
              ...root,
              id: `${config.slugPrefix}-city-${region.code}-${city.code}`,
              wbs_code: cityCode,
              parent_wbs_code: regionCode,
              name_ar: city.name,
              name_en: null,
              slug: citySlug,
              full_path_ar: cityPath,
              level: root.level + 2,
              sort_order: root.sort_order * 1000 + (regionIndex + 1) * 100 + cityIndex + 1,
              requires_project: false
            });

            city.projects.forEach((project, projectIndex) => {
              const projectNo = project.project_no || project.name_ar || `project-${projectIndex + 1}`;
              const projectCode = `${cityCode}.p${projectIndex + 1}`;
              const projectSlug = `${config.slugPrefix}-project-${slugPart(projectNo)}`;
              const projectPath = `${cityPath} > ${projectNo}`;

              syntheticRows.push({
                ...root,
                id: `${config.slugPrefix}-project-${project.id}`,
                wbs_code: projectCode,
                parent_wbs_code: cityCode,
                name_ar: projectNo,
                name_en: null,
                slug: projectSlug,
                full_path_ar: projectPath,
                level: root.level + 3,
                sort_order:
                  root.sort_order * 1000 + (regionIndex + 1) * 100 + (cityIndex + 1) * 10 + projectIndex + 1,
                requires_project: true
              });

              syntheticRows.push({
                ...root,
                id: `${config.slugPrefix}-project-${project.id}-home`,
                wbs_code: `${projectCode}.home`,
                parent_wbs_code: projectCode,
                name_ar: "الرئيسية",
                name_en: null,
                slug: `${projectSlug}-home`,
                full_path_ar: `${projectPath} > الرئيسية`,
                level: root.level + 4,
                sort_order:
                  root.sort_order * 1000000 +
                  (regionIndex + 1) * 100000 +
                  (cityIndex + 1) * 10000 +
                  (projectIndex + 1) * 1000,
                requires_project: true
              });

              templates.forEach((template, templateIndex) => {
                const templateSuffix = template.wbs_code.replace(`${config.rootCode}.`, "");
                const parentSuffix = template.parent_wbs_code?.replace(`${config.rootCode}.`, "");
                const homeCode = `${projectCode}.home`;
                const clonedParentCode =
                  template.parent_wbs_code === config.rootCode
                    ? homeCode
                    : parentSuffix
                      ? `${projectCode}.${parentSuffix}`
                      : homeCode;
                const isHomeChild = template.parent_wbs_code === config.rootCode;
                const displayName = isHomeChild ? projectHomeDisplayName(template) : template.name_ar;
                const displayPathSuffix = projectHomePathSuffix(template, config.rootCode, root.full_path_ar);

                syntheticRows.push({
                  ...template,
                  id: `${template.id}-${project.id}`,
                  wbs_code: `${projectCode}.${templateSuffix}`,
                  parent_wbs_code: clonedParentCode,
                  name_ar: displayName,
                  slug: `${template.slug}-project-${slugPart(projectNo)}`,
                  full_path_ar: `${projectPath} > الرئيسية > ${displayPathSuffix}`,
                  level: root.level + 3 + (template.level - root.level),
                  sort_order:
                    root.sort_order * 1000000 +
                    (regionIndex + 1) * 100000 +
                    (cityIndex + 1) * 10000 +
                    (projectIndex + 1) * 1000 +
                    (isHomeChild ? projectHomeSortRank(template) * 100 : templateIndex + 1)
                });
              });
            });
          });
      });
  }

  return { syntheticRows, transformedRootCodes };
}

export function removeTransformedProjectDescendants(rows: MenuRow[], rootCodes: string[]) {
  return rows.filter((row) => !rootCodes.some((rootCode) => row.wbs_code.startsWith(`${rootCode}.`)));
}
