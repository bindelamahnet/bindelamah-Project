import { NextResponse } from "next/server";
import { buildMenuTree } from "@/lib/erp/menu";
import type { MenuRow } from "@/lib/erp/types";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("group_no,subgroup_no,default_project_id")
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

  return NextResponse.json({ menu: buildMenuTree(withAncestors) });
}
