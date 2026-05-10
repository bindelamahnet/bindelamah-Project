alter table public.projects
add column if not exists city_code text not null default '0';

update public.projects
set city_code = 'dammam'
where id = '10000000-0000-0000-0000-000000000005'
  and project_type = 'electrical'
  and region_code = 'eastern';

insert into public.projects
  (id, company_id, project_no, name_ar, project_type, group_no, subgroup_no, region_code, city_code, is_active)
values
  (
    '10000000-0000-0000-0000-000000000007',
    '00000000-0000-0000-0000-000000000001',
    '4400014805',
    'مشروع الأحساء',
    'electrical',
    1,
    null,
    'eastern',
    'ahsa',
    true
  )
on conflict (id) do update set
  company_id = excluded.company_id,
  project_no = excluded.project_no,
  name_ar = excluded.name_ar,
  project_type = excluded.project_type,
  group_no = excluded.group_no,
  subgroup_no = excluded.subgroup_no,
  region_code = excluded.region_code,
  city_code = excluded.city_code,
  is_active = excluded.is_active;

delete from public.projects
where project_no = '4400014805'
  and id <> '10000000-0000-0000-0000-000000000007';
