insert into public.menu_items
  (wbs_code, parent_wbs_code, name_ar, name_en, slug, full_path_ar, level, sort_order, group_no, subgroup_no, requires_project, is_active)
select
  '0.1.2.1.9',
  '0.1.2.1',
  'الملف الشخصي',
  null,
  'menu-0-1-2-1-9',
  parent.full_path_ar || ' > ' || 'الملف الشخصي',
  parent.level + 1,
  coalesce((select max(sort_order) from public.menu_items where parent_wbs_code = '0.1.2.1'), parent.sort_order) + 1,
  parent.group_no,
  parent.subgroup_no,
  true,
  true
from public.menu_items parent
where parent.wbs_code = '0.1.2.1'
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

insert into public.role_menu_permissions
  (role_id, menu_item_id, can_view, can_create, can_update, can_delete, can_approve)
select
  perms.role_id,
  child.id,
  perms.can_view,
  perms.can_create,
  perms.can_update,
  perms.can_delete,
  perms.can_approve
from public.menu_items child
join public.menu_items parent on parent.wbs_code = '0.1.2.1'
join public.role_menu_permissions perms on perms.menu_item_id = parent.id
where child.wbs_code = '0.1.2.1.9'
on conflict (role_id, menu_item_id) do update set
  can_view = excluded.can_view,
  can_create = excluded.can_create,
  can_update = excluded.can_update,
  can_delete = excluded.can_delete,
  can_approve = excluded.can_approve;
