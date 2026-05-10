do $$
declare
  water_root_path text;
  electrical_admin_path text;
begin
  select full_path_ar into water_root_path
  from public.menu_items
  where wbs_code = '0.1.2.1';

  select full_path_ar into electrical_admin_path
  from public.menu_items
  where wbs_code = '0.1.1.9';

  if water_root_path is null or electrical_admin_path is null then
    raise exception 'Required project menu roots were not found.';
  end if;

  update public.menu_items
  set
    wbs_code = '0.1.2.1.10',
    parent_wbs_code = '0.1.2.1',
    slug = 'menu-0-1-2-1-10',
    full_path_ar = water_root_path || ' > ' || 'الملف الشخصي',
    level = 5,
    sort_order = 10,
    group_no = 2,
    subgroup_no = 1,
    requires_project = true,
    is_active = true
  where wbs_code = '0.1.2.1.9'
    and name_ar = 'الملف الشخصي'
    and not exists (
      select 1 from public.menu_items existing where existing.wbs_code = '0.1.2.1.10'
    );

  insert into public.menu_items
    (wbs_code, parent_wbs_code, name_ar, name_en, slug, full_path_ar, level, sort_order, group_no, subgroup_no, requires_project, is_active)
  select
    replace(source.wbs_code, '0.1.1.9', '0.1.2.1.9'),
    case
      when source.parent_wbs_code = '0.1.1' then '0.1.2.1'
      else replace(source.parent_wbs_code, '0.1.1.9', '0.1.2.1.9')
    end,
    source.name_ar,
    source.name_en,
    replace(source.slug, 'menu-0-1-1-9', 'menu-0-1-2-1-9'),
    water_root_path || ' > الإدارة' || substring(source.full_path_ar from char_length(electrical_admin_path) + 1),
    source.level + 1,
    case
      when source.wbs_code = '0.1.1.9' then 9
      else source.sort_order
    end,
    2,
    1,
    true,
    true
  from public.menu_items source
  where source.wbs_code = '0.1.1.9'
     or source.wbs_code like '0.1.1.9.%'
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

  update public.menu_items
  set
    parent_wbs_code = '0.1.2.1',
    slug = 'menu-0-1-2-1-10',
    full_path_ar = water_root_path || ' > ' || 'الملف الشخصي',
    level = 5,
    sort_order = 10,
    group_no = 2,
    subgroup_no = 1,
    requires_project = true,
    is_active = true
  where wbs_code = '0.1.2.1.10'
    and name_ar = 'الملف الشخصي';
end $$;

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
   or child.wbs_code like '0.1.2.1.9.%'
on conflict (role_id, menu_item_id) do update set
  can_view = excluded.can_view,
  can_create = excluded.can_create,
  can_update = excluded.can_update,
  can_delete = excluded.can_delete,
  can_approve = excluded.can_approve;
