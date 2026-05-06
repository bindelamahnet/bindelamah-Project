insert into public.menu_items
(wbs_code, parent_wbs_code, name_ar, name_en, slug, full_path_ar, level, sort_order, group_no, subgroup_no, requires_project, is_active)
select
  item.wbs_code,
  '0.1.1.9.3',
  item.name_ar,
  null,
  item.slug,
  parent.full_path_ar || ' > ' || item.name_ar,
  parent.level + 1,
  item.sort_order,
  parent.group_no,
  parent.subgroup_no,
  parent.requires_project,
  true
from public.menu_items parent
cross join (
  values
    ('0.1.1.9.3.1', 'المناطق', 'menu-0-1-1-9-3-1', 1231),
    ('0.1.1.9.3.2', 'المدن', 'menu-0-1-1-9-3-2', 1232),
    ('0.1.1.9.3.3', 'الأحياء', 'menu-0-1-1-9-3-3', 1233)
) as item(wbs_code, name_ar, slug, sort_order)
where parent.wbs_code = '0.1.1.9.3'
on conflict (wbs_code) do update set
  parent_wbs_code = excluded.parent_wbs_code,
  name_ar = excluded.name_ar,
  slug = excluded.slug,
  full_path_ar = excluded.full_path_ar,
  level = excluded.level,
  sort_order = excluded.sort_order,
  group_no = excluded.group_no,
  subgroup_no = excluded.subgroup_no,
  requires_project = excluded.requires_project,
  is_active = excluded.is_active,
  updated_at = now();

insert into public.role_menu_permissions
(role_id, menu_item_id, can_view, can_create, can_update, can_delete, can_approve)
select
  parent_permissions.role_id,
  child.id,
  parent_permissions.can_view,
  parent_permissions.can_create,
  parent_permissions.can_update,
  parent_permissions.can_delete,
  parent_permissions.can_approve
from public.role_menu_permissions parent_permissions
join public.menu_items parent on parent.id = parent_permissions.menu_item_id
join public.menu_items child on child.parent_wbs_code = parent.wbs_code
where parent.wbs_code = '0.1.1.9.3'
  and child.wbs_code in ('0.1.1.9.3.1', '0.1.1.9.3.2', '0.1.1.9.3.3')
on conflict (role_id, menu_item_id) do update set
  can_view = excluded.can_view,
  can_create = excluded.can_create,
  can_update = excluded.can_update,
  can_delete = excluded.can_delete,
  can_approve = excluded.can_approve;
