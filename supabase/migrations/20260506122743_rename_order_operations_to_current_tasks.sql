update public.menu_items
set
  name_ar = 'المهام الحالية',
  full_path_ar = regexp_replace(full_path_ar, 'عمليات الأوامر$', 'المهام الحالية'),
  updated_at = now()
where wbs_code = '0.1.1.6'
  and name_ar = 'عمليات الأوامر';
