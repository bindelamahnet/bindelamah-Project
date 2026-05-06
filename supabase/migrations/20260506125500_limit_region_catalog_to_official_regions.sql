update public.menu_items
set is_active = false,
    updated_at = now()
where wbs_code like 'catalog.regions.%'
  and wbs_code not in (
    'catalog.regions.riyadh',
    'catalog.regions.makkah',
    'catalog.regions.madinah',
    'catalog.regions.eastern',
    'catalog.regions.aseer',
    'catalog.regions.qassim',
    'catalog.regions.tabuk',
    'catalog.regions.hail',
    'catalog.regions.jawf',
    'catalog.regions.jazan',
    'catalog.regions.najran',
    'catalog.regions.baha',
    'catalog.regions.northern_borders'
  );
