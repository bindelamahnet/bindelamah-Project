import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type RoleRow = {
  user_id: string;
  roles: { code: string; name_ar: string } | { code: string; name_ar: string }[] | null;
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

function readRole(row: RoleRow) {
  const role = Array.isArray(row.roles) ? row.roles[0] : row.roles;
  return role ? { code: role.code, name_ar: role.name_ar } : null;
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

  const [{ data: authUsers, error: usersError }, { data: profiles }, { data: roleRows }, { data: roles }] =
    await Promise.all([
      admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      admin.from("user_profiles").select("id,full_name,company_id,default_project_id,region_code"),
      admin.from("user_roles").select("user_id,roles(code,name_ar)") as any,
      admin.from("roles").select("id,code,name_ar").order("name_ar")
    ]);

  if (usersError) {
    return NextResponse.json({ error: usersError.message }, { status: 500 });
  }

  const profileMap = new Map((profiles ?? []).map((profile: any) => [profile.id, profile]));
  const rolesByUser = new Map<string, ReturnType<typeof readRole>[]>();

  for (const row of (roleRows ?? []) as RoleRow[]) {
    const role = readRole(row);
    if (!role) continue;
    rolesByUser.set(row.user_id, [...(rolesByUser.get(row.user_id) ?? []), role]);
  }

  const users = authUsers.users.map((user, index) => {
    const profile = profileMap.get(user.id) as any;
    return {
      index: index + 1,
      id: user.id,
      email: user.email ?? "",
      full_name: profile?.full_name ?? user.user_metadata?.full_name ?? "",
      region_code: profile?.region_code ?? "غير محدد",
      roles: rolesByUser.get(user.id) ?? [],
      created_at: user.created_at
    };
  });

  return NextResponse.json({ users, roles: roles ?? [] });
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
  const fullName = typeof body.full_name === "string" ? body.full_name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const confirmPassword = typeof body.confirm_password === "string" ? body.confirm_password : "";
  const roleCode = typeof body.role_code === "string" ? body.role_code : "viewer";
  const regionCode = typeof body.region_code === "string" && body.region_code ? body.region_code : "0";

  if (!fullName || !email || !password || !confirmPassword) {
    return NextResponse.json({ error: "الاسم والبريد وكلمة المرور مطلوبة." }, { status: 400 });
  }

  if (password !== confirmPassword) {
    return NextResponse.json({ error: "كلمة المرور وتأكيدها غير متطابقين." }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل." }, { status: 400 });
  }

  const { data: role, error: roleError } = await admin.from("roles").select("id").eq("code", roleCode).maybeSingle();
  if (roleError || !role) {
    return NextResponse.json({ error: "الصلاحية المحددة غير موجودة." }, { status: 400 });
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName }
  });

  if (createError || !created.user) {
    return NextResponse.json({ error: createError?.message ?? "تعذر إنشاء المستخدم." }, { status: 500 });
  }

  const { error: profileError } = await admin.from("user_profiles").upsert({
    id: created.user.id,
    full_name: fullName,
    region_code: regionCode
  });

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  const { error: userRoleError } = await admin.from("user_roles").upsert({
    user_id: created.user.id,
    role_id: role.id
  });

  if (userRoleError) {
    return NextResponse.json({ error: userRoleError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, user_id: created.user.id });
}
