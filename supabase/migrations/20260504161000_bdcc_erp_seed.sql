insert into public.companies (id, name_ar, name_en, group_no) values
('00000000-0000-0000-0000-000000000001', 'شركة بن دلامة للمقاولات', 'Bin Delamah Contracting Company', 0)
on conflict (id) do update set name_ar = excluded.name_ar, name_en = excluded.name_en, group_no = excluded.group_no;

insert into public.projects (id, company_id, project_no, name_ar, project_type, group_no, subgroup_no, region_code, is_active) values
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'ELEC-001', 'مشاريع الكهرباء', 'electrical', 1, null, '0', true),
('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'WATER-001', 'مشاريع المياه', 'private', 2, 1, '0', true),
('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'UNIV-001', 'مشاريع الجامعة', 'private', 2, 2, '0', true),
('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'SHARED-001', 'الخدمات المشتركة', 'shared', 3, null, '0', true)
on conflict (id) do update set name_ar = excluded.name_ar, project_no = excluded.project_no, project_type = excluded.project_type, group_no = excluded.group_no, subgroup_no = excluded.subgroup_no, is_active = excluded.is_active;

insert into public.roles (code, name_ar, is_system) values
('super_admin', 'مدير النظام', true),
('project_manager', 'مدير المشاريع', true),
('legal_user', 'مستخدم الشؤون القانونية', true),
('warehouse_user', 'مستخدم المستودعات', true),
('viewer', 'مستعرض', true)
on conflict (code) do update set name_ar = excluded.name_ar, is_system = excluded.is_system;

insert into public.permissions (code, name_ar, description) values
('menu.view', 'عرض القائمة', 'عرض شاشات النظام المصرح بها'),
('menu.create', 'إضافة', 'إنشاء سجلات في الشاشة'),
('menu.update', 'تعديل', 'تعديل سجلات الشاشة'),
('menu.delete', 'حذف', 'حذف سجلات الشاشة'),
('menu.approve', 'اعتماد', 'اعتماد إجراءات الشاشة')
on conflict (code) do update set name_ar = excluded.name_ar, description = excluded.description;

insert into public.menu_items
(wbs_code, parent_wbs_code, name_ar, name_en, slug, full_path_ar, level, sort_order, group_no, subgroup_no, requires_project)
values
('0', null, 'مجموعة شركات بن دلامة', null, 'bdcc-group', 'مجموعة شركات بن دلامة', 1, 1, 0, null, false),
('0.1', '0', 'مشاريع الشركة (شركة بن دلامة للمقاولات)', null, 'company-projects', 'مجموعة شركات بن دلامة > مشاريع الشركة (شركة بن دلامة للمقاولات)', 2, 2, 0, null, false),
('0.1.1', '0.1', 'مشاريع الكهرباء', null, 'electrical-projects', 'مجموعة شركات بن دلامة > مشاريع الشركة (شركة بن دلامة للمقاولات) > مشاريع الكهرباء', 3, 3, 1, null, true),
('0.1.1.1', '0.1.1', 'القسم الفني', null, 'menu-0-1-1-1', 'مجموعة شركات بن دلامة > مشاريع الشركة (شركة بن دلامة للمقاولات) > مشاريع الكهرباء > القسم الفني', 4, 4, 1, null, true),
('0.1.1.2', '0.1.1', 'مدير المشاريع', null, 'menu-0-1-1-2', 'مجموعة شركات بن دلامة > مشاريع الشركة (شركة بن دلامة للمقاولات) > مشاريع الكهرباء > مدير المشاريع', 4, 5, 1, null, true),
('0.1.1.3', '0.1.1', 'الإنتاجية', null, 'menu-0-1-1-3', 'مجموعة شركات بن دلامة > مشاريع الشركة (شركة بن دلامة للمقاولات) > مشاريع الكهرباء > الإنتاجية', 4, 6, 1, null, true),
('0.1.1.4', '0.1.1', 'الأرشيف', null, 'menu-0-1-1-4', 'مجموعة شركات بن دلامة > مشاريع الشركة (شركة بن دلامة للمقاولات) > مشاريع الكهرباء > الأرشيف', 4, 7, 1, null, true),
('0.1.1.5', '0.1.1', 'موظف سكيكو', null, 'menu-0-1-1-5', 'مجموعة شركات بن دلامة > مشاريع الشركة (شركة بن دلامة للمقاولات) > مشاريع الكهرباء > موظف سكيكو', 4, 8, 1, null, true),
('0.1.1.6', '0.1.1', 'عمليات الأوامر', null, 'menu-0-1-1-6', 'مجموعة شركات بن دلامة > مشاريع الشركة (شركة بن دلامة للمقاولات) > مشاريع الكهرباء > عمليات الأوامر', 4, 9, 1, null, true),
('0.1.1.7', '0.1.1', 'إدارة المستودع', null, 'menu-0-1-1-7', 'مجموعة شركات بن دلامة > مشاريع الشركة (شركة بن دلامة للمقاولات) > مشاريع الكهرباء > إدارة المستودع', 4, 10, 1, null, true),
('0.1.1.8', '0.1.1', 'التقارير', null, 'menu-0-1-1-8', 'مجموعة شركات بن دلامة > مشاريع الشركة (شركة بن دلامة للمقاولات) > مشاريع الكهرباء > التقارير', 4, 11, 1, null, true),
('0.1.1.9', '0.1.1', 'الإدارة', null, 'menu-0-1-1-9', 'مجموعة شركات بن دلامة > مشاريع الشركة (شركة بن دلامة للمقاولات) > مشاريع الكهرباء > الإدارة', 4, 12, 1, null, true),
('0.1.1.10', '0.1.1', 'إعدادات النظام', null, 'menu-0-1-1-10', 'مجموعة شركات بن دلامة > مشاريع الشركة (شركة بن دلامة للمقاولات) > مشاريع الكهرباء > إعدادات النظام', 4, 13, 1, null, true),
('0.1.2', '0.1', 'المشاريع الخاصة', null, 'private-projects', 'مجموعة شركات بن دلامة > مشاريع الشركة (شركة بن دلامة للمقاولات) > المشاريع الخاصة', 3, 14, 2, null, true),
('0.1.2.1', '0.1.2', 'مشاريع المياه', null, 'water-projects', 'مجموعة شركات بن دلامة > مشاريع الشركة (شركة بن دلامة للمقاولات) > المشاريع الخاصة > مشاريع المياه', 4, 15, 2, 1, true),
('0.1.2.1.1', '0.1.2.1', 'الرئيسية', null, 'menu-0-1-2-1-1', 'مجموعة شركات بن دلامة > مشاريع الشركة (شركة بن دلامة للمقاولات) > المشاريع الخاصة > مشاريع المياه > الرئيسية', 5, 16, 2, 1, true),
('0.1.2.1.1.1', '0.1.2.1.1', 'لوحة التحكم', null, 'menu-0-1-2-1-1-1', 'مجموعة شركات بن دلامة > مشاريع الشركة (شركة بن دلامة للمقاولات) > المشاريع الخاصة > مشاريع المياه > الرئيسية > لوحة التحكم', 6, 17, 2, 1, true),
('0.1.2.1.2', '0.1.2.1', 'الأصناف', null, 'menu-0-1-2-1-2', 'مجموعة شركات بن دلامة > مشاريع الشركة (شركة بن دلامة للمقاولات) > المشاريع الخاصة > مشاريع المياه > الأصناف', 5, 18, 2, 1, true),
('0.1.2.1.3', '0.1.2.1', 'أرصدة المخزون', null, 'menu-0-1-2-1-3', 'مجموعة شركات بن دلامة > مشاريع الشركة (شركة بن دلامة للمقاولات) > المشاريع الخاصة > مشاريع المياه > أرصدة المخزون', 5, 19, 2, 1, true),
('0.1.2.1.4', '0.1.2.1', 'كارت الصنف', null, 'menu-0-1-2-1-4', 'مجموعة شركات بن دلامة > مشاريع الشركة (شركة بن دلامة للمقاولات) > المشاريع الخاصة > مشاريع المياه > كارت الصنف', 5, 20, 2, 1, true),
('0.1.2.1.5', '0.1.2.1', 'البيانات الأساسية', null, 'menu-0-1-2-1-5', 'مجموعة شركات بن دلامة > مشاريع الشركة (شركة بن دلامة للمقاولات) > المشاريع الخاصة > مشاريع المياه > البيانات الأساسية', 5, 21, 2, 1, true),
('0.1.2.1.5.1', '0.1.2.1.5', 'المخازن', null, 'menu-0-1-2-1-5-1', 'مجموعة شركات بن دلامة > مشاريع الشركة (شركة بن دلامة للمقاولات) > المشاريع الخاصة > مشاريع المياه > البيانات الأساسية > المخازن', 6, 22, 2, 1, true),
('0.1.2.1.5.2', '0.1.2.1.5', 'المشاريع', null, 'menu-0-1-2-1-5-2', 'مجموعة شركات بن دلامة > مشاريع الشركة (شركة بن دلامة للمقاولات) > المشاريع الخاصة > مشاريع المياه > البيانات الأساسية > المشاريع', 6, 23, 2, 1, true),
('0.1.2.1.5.3', '0.1.2.1.5', 'الموردين', null, 'menu-0-1-2-1-5-3', 'مجموعة شركات بن دلامة > مشاريع الشركة (شركة بن دلامة للمقاولات) > المشاريع الخاصة > مشاريع المياه > البيانات الأساسية > الموردين', 6, 24, 2, 1, true),
('0.1.2.1.5.4', '0.1.2.1.5', 'المقاولين', null, 'menu-0-1-2-1-5-4', 'مجموعة شركات بن دلامة > مشاريع الشركة (شركة بن دلامة للمقاولات) > المشاريع الخاصة > مشاريع المياه > البيانات الأساسية > المقاولين', 6, 25, 2, 1, true),
('0.1.2.1.6', '0.1.2.1', 'حركات المخزون', null, 'menu-0-1-2-1-6', 'مجموعة شركات بن دلامة > مشاريع الشركة (شركة بن دلامة للمقاولات) > المشاريع الخاصة > مشاريع المياه > حركات المخزون', 5, 26, 2, 1, true),
('0.1.2.1.6.1', '0.1.2.1.6', 'الوارد', null, 'menu-0-1-2-1-6-1', 'مجموعة شركات بن دلامة > مشاريع الشركة (شركة بن دلامة للمقاولات) > المشاريع الخاصة > مشاريع المياه > حركات المخزون > الوارد', 6, 27, 2, 1, true),
('0.1.2.1.6.2', '0.1.2.1.6', 'الصرف', null, 'menu-0-1-2-1-6-2', 'مجموعة شركات بن دلامة > مشاريع الشركة (شركة بن دلامة للمقاولات) > المشاريع الخاصة > مشاريع المياه > حركات المخزون > الصرف', 6, 28, 2, 1, true),
('0.1.2.1.6.3', '0.1.2.1.6', 'المرتجعات', null, 'menu-0-1-2-1-6-3', 'مجموعة شركات بن دلامة > مشاريع الشركة (شركة بن دلامة للمقاولات) > المشاريع الخاصة > مشاريع المياه > حركات المخزون > المرتجعات', 6, 29, 2, 1, true),
('0.1.2.1.6.4', '0.1.2.1.6', 'التحويلات', null, 'menu-0-1-2-1-6-4', 'مجموعة شركات بن دلامة > مشاريع الشركة (شركة بن دلامة للمقاولات) > المشاريع الخاصة > مشاريع المياه > حركات المخزون > التحويلات', 6, 30, 2, 1, true),
('0.1.2.1.6.5', '0.1.2.1.6', 'التسويات', null, 'menu-0-1-2-1-6-5', 'مجموعة شركات بن دلامة > مشاريع الشركة (شركة بن دلامة للمقاولات) > المشاريع الخاصة > مشاريع المياه > حركات المخزون > التسويات', 6, 31, 2, 1, true),
('0.1.2.1.7', '0.1.2.1', 'التقارير', null, 'menu-0-1-2-1-7', 'مجموعة شركات بن دلامة > مشاريع الشركة (شركة بن دلامة للمقاولات) > المشاريع الخاصة > مشاريع المياه > التقارير', 5, 32, 2, 1, true),
('0.1.2.1.7.1', '0.1.2.1.7', 'التقارير', null, 'menu-0-1-2-1-7-1', 'مجموعة شركات بن دلامة > مشاريع الشركة (شركة بن دلامة للمقاولات) > المشاريع الخاصة > مشاريع المياه > التقارير > التقارير', 6, 33, 2, 1, true),
('0.1.2.1.7.2', '0.1.2.1.7', 'التحليل المالي', null, 'menu-0-1-2-1-7-2', 'مجموعة شركات بن دلامة > مشاريع الشركة (شركة بن دلامة للمقاولات) > المشاريع الخاصة > مشاريع المياه > التقارير > التحليل المالي', 6, 34, 2, 1, true),
('0.1.2.1.8', '0.1.2.1', 'الاستيراد', null, 'menu-0-1-2-1-8', 'مجموعة شركات بن دلامة > مشاريع الشركة (شركة بن دلامة للمقاولات) > المشاريع الخاصة > مشاريع المياه > الاستيراد', 5, 35, 2, 1, true),
('0.1.2.1.8.1', '0.1.2.1.8', 'استيراد من Excel', null, 'menu-0-1-2-1-8-1', 'مجموعة شركات بن دلامة > مشاريع الشركة (شركة بن دلامة للمقاولات) > المشاريع الخاصة > مشاريع المياه > الاستيراد > استيراد من Excel', 6, 36, 2, 1, true),
('0.1.2.2', '0.1.2', 'مشاريع الجامعة', null, 'university-projects', 'مجموعة شركات بن دلامة > مشاريع الشركة (شركة بن دلامة للمقاولات) > المشاريع الخاصة > مشاريع الجامعة', 4, 37, 2, 2, true),
('0.1.2.3', '0.1.2', 'مشاريع أخرى', null, 'other-projects', 'مجموعة شركات بن دلامة > مشاريع الشركة (شركة بن دلامة للمقاولات) > المشاريع الخاصة > مشاريع أخرى', 4, 38, 2, null, true),
('0.2', '0', 'الخدمات المشتركة', null, 'shared-services', 'مجموعة شركات بن دلامة > الخدمات المشتركة', 2, 39, 3, null, false),
('0.2.1', '0.2', 'الموارد البشرية', null, 'hr', 'مجموعة شركات بن دلامة > الخدمات المشتركة > الموارد البشرية', 3, 40, 3, null, false),
('0.2.2', '0.2', 'الشؤون القانونية', null, 'legal', 'مجموعة شركات بن دلامة > الخدمات المشتركة > الشؤون القانونية', 3, 41, 3, null, false),
('0.2.3', '0.2', 'المالية العامة', null, 'finance', 'مجموعة شركات بن دلامة > الخدمات المشتركة > المالية العامة', 3, 42, 3, null, false),
('0.2.4', '0.2', 'المشتريات', null, 'procurement', 'مجموعة شركات بن دلامة > الخدمات المشتركة > المشتريات', 3, 43, 3, null, false),
('0.2.5', '0.2', 'تقنية المعلومات', null, 'it', 'مجموعة شركات بن دلامة > الخدمات المشتركة > تقنية المعلومات', 3, 44, 3, null, false),
('0.2.6', '0.2', 'الأرشيف العام', null, 'archive', 'مجموعة شركات بن دلامة > الخدمات المشتركة > الأرشيف العام', 3, 45, 3, null, false),
('0.2.7', '0.2', 'إدارة العقود', null, 'contracts', 'مجموعة شركات بن دلامة > الخدمات المشتركة > إدارة العقود', 3, 46, 3, null, false),
('0.2.8', '0.2', 'الخدمات الإدارية', null, 'administrative-services', 'مجموعة شركات بن دلامة > الخدمات المشتركة > الخدمات الإدارية', 3, 47, 3, null, false)
on conflict (wbs_code) do update set
 parent_wbs_code = excluded.parent_wbs_code,
 name_ar = excluded.name_ar,
 name_en = excluded.name_en,
 slug = excluded.slug,
 full_path_ar = excluded.full_path_ar,
 level = excluded.level,
 sort_order = excluded.sort_order,
 group_no = excluded.group_no,
 subgroup_no = excluded.subgroup_no,
 requires_project = excluded.requires_project,
 is_active = true;

insert into public.role_menu_permissions (role_id, menu_item_id, can_view, can_create, can_update, can_delete, can_approve)
select r.id, mi.id, true, true, true, true, true
from public.roles r cross join public.menu_items mi
where r.code = 'super_admin'
on conflict (role_id, menu_item_id) do update set can_view = true, can_create = true, can_update = true, can_delete = true, can_approve = true;

insert into public.role_menu_permissions (role_id, menu_item_id, can_view, can_create, can_update, can_delete, can_approve)
select r.id, mi.id, true, true, true, false, true
from public.roles r cross join public.menu_items mi
where r.code = 'project_manager' and mi.group_no in (0, 1, 2)
on conflict (role_id, menu_item_id) do update set can_view = true, can_create = true, can_update = true, can_delete = false, can_approve = true;

insert into public.role_menu_permissions (role_id, menu_item_id, can_view, can_create, can_update)
select r.id, mi.id, true, true, true
from public.roles r cross join public.menu_items mi
where r.code = 'legal_user' and (mi.slug in ('legal', 'contracts') or mi.full_path_ar like '%الشؤون القانونية%' or mi.full_path_ar like '%العقود%')
on conflict (role_id, menu_item_id) do update set can_view = true, can_create = true, can_update = true;

insert into public.role_menu_permissions (role_id, menu_item_id, can_view, can_create, can_update)
select r.id, mi.id, true, true, true
from public.roles r cross join public.menu_items mi
where r.code = 'warehouse_user' and (mi.full_path_ar like '%المستودع%' or mi.full_path_ar like '%المخزون%' or mi.full_path_ar like '%المخازن%')
on conflict (role_id, menu_item_id) do update set can_view = true, can_create = true, can_update = true;

insert into public.role_menu_permissions (role_id, menu_item_id, can_view)
select r.id, mi.id, true
from public.roles r cross join public.menu_items mi
where r.code = 'viewer'
on conflict (role_id, menu_item_id) do update set can_view = true;

insert into public.user_roles (user_id, role_id)
select up.id, r.id
from public.user_profiles up
cross join public.roles r
where r.code = 'viewer'
on conflict (user_id, role_id) do nothing;
