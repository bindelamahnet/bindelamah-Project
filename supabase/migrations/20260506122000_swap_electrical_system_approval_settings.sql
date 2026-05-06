update public.menu_items child
set
  name_ar = 'إعدادات النظام',
  full_path_ar = parent.full_path_ar || ' > إعدادات النظام',
  updated_at = now()
from public.menu_items parent
where child.wbs_code = '0.1.1.9.4'
  and parent.wbs_code = '0.1.1.9';

update public.menu_items child
set
  name_ar = 'إعدادات الاعتماد',
  full_path_ar = parent.full_path_ar || ' > إعدادات الاعتماد',
  updated_at = now()
from public.menu_items parent
where child.wbs_code = '0.1.1.10'
  and parent.wbs_code = '0.1.1';
