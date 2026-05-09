update public.menu_items
set
  name_ar = 'سلة المهام',
  full_path_ar = regexp_replace(full_path_ar, '(عمليات الأوامر|المهام الحالية)$', 'سلة المهام'),
  updated_at = now()
where wbs_code = '0.1.1.6'
  and name_ar in ('عمليات الأوامر', 'المهام الحالية');
