alter table public.projects
add column if not exists city_code text not null default '0';

update public.projects
set city_code = case
  when region_code = 'eastern' then 'dammam'
  when region_code = 'riyadh' then 'riyadh'
  when region_code = 'makkah' then 'makkah'
  when region_code = 'madinah' then 'madinah'
  when region_code = 'aseer' then 'abha'
  when region_code = 'qassim' then 'buraydah'
  when region_code = 'tabuk' then 'tabuk'
  when region_code = 'hail' then 'hail'
  when region_code = 'jawf' then 'sakaka'
  when region_code = 'jazan' then 'jazan'
  when region_code = 'najran' then 'najran'
  when region_code = 'baha' then 'baha'
  when region_code = 'northern_borders' then 'arar'
  else '0'
end
where city_code = '0';
