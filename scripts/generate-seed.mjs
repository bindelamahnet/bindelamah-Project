import fs from "node:fs";

const items = JSON.parse(fs.readFileSync("menu_items.json", "utf8"));
const quote = (value) => (value == null ? "null" : `'${String(value).replaceAll("'", "''")}'`);
const bool = (value) => (value ? "true" : "false");

const menuRows = items
  .map((item, index) => {
    const requiresProject = item.level >= 3 && item.group_no !== 3;
    return `(${quote(item.wbs_code)}, ${quote(item.parent_code)}, ${quote(item.name_ar)}, ${quote(
      item.name_en ?? null
    )}, ${quote(item.slug)}, ${quote(item.full_path_ar)}, ${item.level}, ${index + 1}, ${item.group_no ?? 0}, ${
      item.subgroup_no == null ? "null" : item.subgroup_no
    }, ${bool(requiresProject)})`;
  })
  .join(",\n");

const sql = `insert into public.companies (id, name_ar, name_en, group_no) values
('00000000-0000-0000-0000-000000000001', 'شركة بن دلامة للمقاولات', 'Bin Delamah Contracting Company', 0)
on conflict (id) do update set name_ar = excluded.name_ar, name_en = excluded.name_en, group_no = excluded.group_no;

insert into public.projects (id, company_id, project_no, name_ar, project_type, group_no, subgroup_no, region_code, is_active) values
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'ELEC-001', 'مشاريع الكهرباء', 'electrical', 1, null, '0', true),
('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'WATER-001', 'مشاريع المياه', 'private', 2, 1, '0', true),
('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'UNIV-001', 'مشاريع الجامعة', 'private', 2, 2, '0', true),
('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'SHARED-001', 'الخدمات المشتركة', 'shared', 3, null, '0', true)
on conflict (id) do update set name_ar = excluded.name_ar, project_no = excluded.project_no, project_type = excluded.project_type, group_no = excluded.group_no, subgroup_no = excluded.subgroup_no, is_active = excluded.is_active;

insert into public.roles (code, name_ar, is_system) values
('super_admin', 'مدير النظام', true),
('project_manager', 'مدير المشاريع', true),
('legal_user', 'مستخدم الشؤون القانونية', true),
('warehouse_user', 'مستخدم المستودعات', true),
('viewer', 'مستعرض', true)
on conflict (code) do update set name_ar = excluded.name_ar, is_system = excluded.is_system;

insert into public.permissions (code, name_ar, description) values
('menu.view', 'عرض القائمة', 'عرض شاشات النظام المصرح بها'),
('menu.create', 'إضافة', 'إنشاء سجلات في الشاشة'),
('menu.update', 'تعديل', 'تعديل سجلات الشاشة'),
('menu.delete', 'حذف', 'حذف سجلات الشاشة'),
('menu.approve', 'اعتماد', 'اعتماد إجراءات الشاشة')
on conflict (code) do update set name_ar = excluded.name_ar, description = excluded.description;

insert into public.menu_items
(wbs_code, parent_wbs_code, name_ar, name_en, slug, full_path_ar, level, sort_order, group_no, subgroup_no, requires_project)
values
${menuRows}
on conflict (wbs_code) do update set
 parent_wbs_code = excluded.parent_wbs_code,
 name_ar = excluded.name_ar,
 name_en = excluded.name_en,
 slug = excluded.slug,
 full_path_ar = excluded.full_path_ar,
 level = excluded.level,
 sort_order = excluded.sort_order,
 group_no = excluded.group_no,
 subgroup_no = excluded.subgroup_no,
 requires_project = excluded.requires_project,
 is_active = true;

insert into public.role_menu_permissions (role_id, menu_item_id, can_view, can_create, can_update, can_delete, can_approve)
select r.id, mi.id, true, true, true, true, true
from public.roles r cross join public.menu_items mi
where r.code = 'super_admin'
on conflict (role_id, menu_item_id) do update set can_view = true, can_create = true, can_update = true, can_delete = true, can_approve = true;

insert into public.role_menu_permissions (role_id, menu_item_id, can_view, can_create, can_update, can_delete, can_approve)
select r.id, mi.id, true, true, true, false, true
from public.roles r cross join public.menu_items mi
where r.code = 'project_manager' and mi.group_no in (0, 1, 2)
on conflict (role_id, menu_item_id) do update set can_view = true, can_create = true, can_update = true, can_delete = false, can_approve = true;

insert into public.role_menu_permissions (role_id, menu_item_id, can_view, can_create, can_update)
select r.id, mi.id, true, true, true
from public.roles r cross join public.menu_items mi
where r.code = 'legal_user' and (mi.slug in ('legal', 'contracts') or mi.full_path_ar like '%الشؤون القانونية%' or mi.full_path_ar like '%العقود%')
on conflict (role_id, menu_item_id) do update set can_view = true, can_create = true, can_update = true;

insert into public.role_menu_permissions (role_id, menu_item_id, can_view, can_create, can_update)
select r.id, mi.id, true, true, true
from public.roles r cross join public.menu_items mi
where r.code = 'warehouse_user' and (mi.full_path_ar like '%المستودع%' or mi.full_path_ar like '%المخزون%' or mi.full_path_ar like '%المخازن%')
on conflict (role_id, menu_item_id) do update set can_view = true, can_create = true, can_update = true;

insert into public.role_menu_permissions (role_id, menu_item_id, can_view)
select r.id, mi.id, true
from public.roles r cross join public.menu_items mi
where r.code = 'viewer'
on conflict (role_id, menu_item_id) do update set can_view = true;

insert into public.user_roles (user_id, role_id)
select up.id, r.id
from public.user_profiles up
cross join public.roles r
where r.code = 'viewer'
on conflict (user_id, role_id) do nothing;
`;

fs.writeFileSync("supabase/migrations/20260504161000_bdcc_erp_seed.sql", sql);
console.log(`Generated ${items.length} menu seed rows.`);
