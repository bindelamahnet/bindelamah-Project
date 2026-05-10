insert into public.projects
  (id, company_id, project_no, name_ar, project_type, group_no, subgroup_no, region_code, is_active)
values
  (
    '10000000-0000-0000-0000-000000000008',
    '00000000-0000-0000-0000-000000000001',
    '4400014839',
    'مشروع حفر الباطن',
    'electrical',
    1,
    null,
    'eastern',
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
  is_active = excluded.is_active;

delete from public.projects
where project_no = '4400014839'
  and id <> '10000000-0000-0000-0000-000000000008';
