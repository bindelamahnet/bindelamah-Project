insert into public.menu_items
(wbs_code, parent_wbs_code, name_ar, name_en, slug, full_path_ar, level, sort_order, group_no, subgroup_no, requires_project, is_active)
values
  ('catalog.regions.riyadh', null, 'الرياض', null, 'region-catalog-riyadh', 'كتالوج المناطق > الرياض', 1, 10, 0, null, false, true),
  ('catalog.regions.makkah', null, 'مكة المكرمة', null, 'region-catalog-makkah', 'كتالوج المناطق > مكة المكرمة', 1, 20, 0, null, false, true),
  ('catalog.regions.madinah', null, 'المدينة المنورة', null, 'region-catalog-madinah', 'كتالوج المناطق > المدينة المنورة', 1, 30, 0, null, false, true),
  ('catalog.regions.eastern', null, 'الشرقية', null, 'region-catalog-eastern', 'كتالوج المناطق > الشرقية', 1, 40, 0, null, false, true),
  ('catalog.regions.aseer', null, 'عسير', null, 'region-catalog-aseer', 'كتالوج المناطق > عسير', 1, 50, 0, null, false, true),
  ('catalog.regions.qassim', null, 'القصيم', null, 'region-catalog-qassim', 'كتالوج المناطق > القصيم', 1, 60, 0, null, false, true),
  ('catalog.regions.tabuk', null, 'تبوك', null, 'region-catalog-tabuk', 'كتالوج المناطق > تبوك', 1, 70, 0, null, false, true),
  ('catalog.regions.hail', null, 'حائل', null, 'region-catalog-hail', 'كتالوج المناطق > حائل', 1, 80, 0, null, false, true),
  ('catalog.regions.jawf', null, 'الجوف', null, 'region-catalog-jawf', 'كتالوج المناطق > الجوف', 1, 90, 0, null, false, true),
  ('catalog.regions.jazan', null, 'جازان', null, 'region-catalog-jazan', 'كتالوج المناطق > جازان', 1, 100, 0, null, false, true),
  ('catalog.regions.najran', null, 'نجران', null, 'region-catalog-najran', 'كتالوج المناطق > نجران', 1, 110, 0, null, false, true),
  ('catalog.regions.baha', null, 'الباحة', null, 'region-catalog-baha', 'كتالوج المناطق > الباحة', 1, 120, 0, null, false, true),
  ('catalog.regions.northern_borders', null, 'الحدود الشمالية', null, 'region-catalog-northern_borders', 'كتالوج المناطق > الحدود الشمالية', 1, 130, 0, null, false, true),
  ('catalog.regions.jubail', null, 'الجبيل', null, 'region-catalog-jubail', 'كتالوج المناطق > الجبيل', 1, 140, 0, null, false, true)
on conflict (wbs_code) do update set
  name_ar = excluded.name_ar,
  slug = excluded.slug,
  full_path_ar = excluded.full_path_ar,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  updated_at = now();
