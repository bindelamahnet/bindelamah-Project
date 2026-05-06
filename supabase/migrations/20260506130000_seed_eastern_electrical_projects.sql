insert into public.projects
(id, company_id, project_no, name_ar, project_type, group_no, subgroup_no, region_code, is_active)
values
  (
    '10000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000001',
    'ELEC-002',
    'مشروع الشرقية 1',
    'electrical',
    1,
    null,
    'eastern',
    true
  ),
  (
    '10000000-0000-0000-0000-000000000006',
    '00000000-0000-0000-0000-000000000001',
    'ELEC-003',
    'مشروع الشرقية 2',
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
