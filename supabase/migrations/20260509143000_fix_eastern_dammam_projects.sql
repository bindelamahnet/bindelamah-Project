update public.projects
set project_no = '4400014818'
where id = '10000000-0000-0000-0000-000000000005'
  and project_type = 'electrical'
  and region_code = 'eastern';

delete from public.projects
where id = '10000000-0000-0000-0000-000000000006'
  and project_type = 'electrical'
  and region_code = 'eastern';
