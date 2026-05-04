export type MenuRow = {
  id: string;
  wbs_code: string;
  parent_wbs_code: string | null;
  name_ar: string;
  name_en: string | null;
  slug: string;
  full_path_ar: string;
  level: number;
  sort_order: number;
  group_no: number;
  subgroup_no: number | null;
  requires_project: boolean;
  has_children?: boolean;
  can_view?: boolean;
  can_create?: boolean;
  can_update?: boolean;
  can_delete?: boolean;
  can_approve?: boolean;
};

export type MenuNode = MenuRow & {
  children: MenuNode[];
};

export type UserContext = {
  user: {
    id: string;
    email: string | null;
  };
  profile: {
    full_name: string | null;
    company_id: string | null;
    default_project_id: string | null;
    group_no: number | null;
    subgroup_no: number | null;
    region_code: string | null;
  } | null;
  roles: Array<{
    id: string;
    code: string;
    name_ar: string;
  }>;
};
