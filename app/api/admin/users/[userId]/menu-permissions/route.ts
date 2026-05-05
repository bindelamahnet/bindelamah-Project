import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type RouteProps = {
  params: Promise<{ userId: string }>;
};

type RoleJoin = {
  role_id: string;
  roles: { id: string; code: string; name_ar: string } | { id: string; code: string; name_ar: string }[] | null;
};

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

function readRole(row: RoleJoin) {
  const role = Array.isArray(row.roles) ? row.roles[0] : row.roles;
  return role ? { id: role.id, code: role.code, name_ar: role.name_ar } : null;
}

function userRoleCode(userId: string) {
  return `user_${userId.replaceAll("-", "")}`;
}

async function loadTargetAccess(admin: ReturnType<typeof createAdminClient>, userId: string) {
  const [{ data: authUser, error: authUserError }, { data: profile }, { data: roleRows, error: rolesError }] =
    await Promise.all([
      admin.auth.admin.getUserById(userId),
      admin.from("user_profiles").select("full_name,region_code").eq("id", userId).maybeSingle(),
      admin.from("user_roles").select("role_id,roles(id,code,name_ar)").eq("user_id", userId) as any
    ]);

  if (authUserError || !authUser?.user) {
    return { error: NextResponse.json({ error: authUserError?.message ?? "المستخدم غير موجود." }, { status: 404 }) };
  }

  if (rolesError) {
    return { error: NextResponse.json({ error: rolesError.message }, { status: 500 }) };
  }

  const roles = ((roleRows ?? []) as RoleJoin[]).map(readRole).filter(Boolean) as Array<{
    id: string;
    code: string;
    name_ar: string;
  }>;

  return {
    user: {
      id: authUser.user.id,
      email: authUser.user.email ?? "",
      full_name: (profile as any)?.full_name ?? authUser.user.user_metadata?.full_name ?? "",
      region_code: (profile as any)?.region_code ?? "0",
      roles
    }
  };
}

export async function GET(_request: Request, { params }: RouteProps) {
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

  const { userId } = await params;
  const target = await loadTargetAccess(admin, userId);
  if (target.error) return target.error;

  const roleIds = target.user.roles.map((role) => role.id);
  const [{ data: menuItems, error: menuError }, { data: permissions, error: permissionsError }] = await Promise.all([
    admin
      .from("menu_items")
      .select("id,wbs_code,parent_wbs_code,name_ar,name_en,slug,full_path_ar,level,sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("wbs_code", { ascending: true }),
    roleIds.length
      ? admin
          .from("role_menu_permissions")
          .select("menu_item_id,can_view,can_create,can_update,can_delete,can_approve")
          .in("role_id", roleIds)
      : Promise.resolve({ data: [], error: null })
  ]);

  if (menuError) {
    return NextResponse.json({ error: menuError.message }, { status: 500 });
  }

  if (permissionsError) {
    return NextResponse.json({ error: permissionsError.message }, { status: 500 });
  }

  const permissionMap = new Map<string, any>();
  for (const permission of permissions ?? []) {
    const current = permissionMap.get((permission as any).menu_item_id);
    permissionMap.set((permission as any).menu_item_id, {
      can_view: Boolean(current?.can_view || (permission as any).can_view),
      can_create: Boolean(current?.can_create || (permission as any).can_create),
      can_update: Boolean(current?.can_update || (permission as any).can_update),
      can_delete: Boolean(current?.can_delete || (permission as any).can_delete),
      can_approve: Boolean(current?.can_approve || (permission as any).can_approve)
    });
  }

  const menu = (menuItems ?? []).map((item: any) => ({
    ...item,
    can_view: Boolean(permissionMap.get(item.id)?.can_view)
  }));

  return NextResponse.json({ user: target.user, menu });
}

export async function PUT(request: Request, { params }: RouteProps) {
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

  const { userId } = await params;
  const target = await loadTargetAccess(admin, userId);
  if (target.error) return target.error;

  if (target.user.roles.some((role) => role.code === "super_admin")) {
    return NextResponse.json({ error: "لا يمكن تعديل صلاحيات مدير النظام الرئيسي من هذه الشاشة." }, { status: 400 });
  }

  const body = await request.json();
  const requestedPermissions = Array.isArray(body.permissions) ? body.permissions : [];
  const allowedIds = requestedPermissions
    .filter((permission: any) => typeof permission.menu_item_id === "string" && permission.can_view === true)
    .map((permission: any) => permission.menu_item_id);

  const roleCode = userRoleCode(userId);
  const roleName = `صلاحيات ${target.user.full_name || target.user.email || userId}`;
  const { data: role, error: roleError } = await admin
    .from("roles")
    .upsert({ code: roleCode, name_ar: roleName, is_system: false }, { onConflict: "code" })
    .select("id,code,name_ar")
    .single();

  if (roleError || !role) {
    return NextResponse.json({ error: roleError?.message ?? "تعذر إنشاء دور الصلاحيات." }, { status: 500 });
  }

  const { error: deleteUserRolesError } = await admin.from("user_roles").delete().eq("user_id", userId);
  if (deleteUserRolesError) {
    return NextResponse.json({ error: deleteUserRolesError.message }, { status: 500 });
  }

  const { error: insertUserRoleError } = await admin.from("user_roles").insert({ user_id: userId, role_id: role.id });
  if (insertUserRoleError) {
    return NextResponse.json({ error: insertUserRoleError.message }, { status: 500 });
  }

  const { error: deletePermissionsError } = await admin.from("role_menu_permissions").delete().eq("role_id", role.id);
  if (deletePermissionsError) {
    return NextResponse.json({ error: deletePermissionsError.message }, { status: 500 });
  }

  if (allowedIds.length) {
    const rows = allowedIds.map((menuItemId: string) => ({
      role_id: role.id,
      menu_item_id: menuItemId,
      can_view: true,
      can_create: false,
      can_update: false,
      can_delete: false,
      can_approve: false
    }));
    const { error: insertPermissionsError } = await admin.from("role_menu_permissions").insert(rows);

    if (insertPermissionsError) {
      return NextResponse.json({ error: insertPermissionsError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, role });
}
