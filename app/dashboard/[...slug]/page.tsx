import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ slug: string[] }>;
};

export default async function MenuPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const currentSlug = slug.at(-1);

  const { data: permissions } = await supabase
    .from("role_menu_permissions")
    .select("can_create,can_update,can_delete,can_approve,menu_items(wbs_code,slug,name_ar,full_path_ar)")
    .eq("can_view", true);

  const permission = (permissions ?? []).find((row: any) => {
    const item = Array.isArray(row.menu_items) ? row.menu_items[0] : row.menu_items;
    return item?.slug === currentSlug;
  }) as any;

  if (!permission) {
    notFound();
  }

  const item = Array.isArray(permission.menu_items) ? permission.menu_items[0] : permission.menu_items;

  return (
    <main className="content-page">
      <header className="page-header">
        <p>{item.wbs_code}</p>
        <h2>{item.name_ar}</h2>
        <span>{item.full_path_ar}</span>
      </header>

      <section className="module-panel">
        <h3>صلاحياتك في هذه الشاشة</h3>
        <div className="permission-row">
          <span className={permission.can_create ? "allowed" : ""}>إضافة</span>
          <span className={permission.can_update ? "allowed" : ""}>تعديل</span>
          <span className={permission.can_delete ? "allowed" : ""}>حذف</span>
          <span className={permission.can_approve ? "allowed" : ""}>اعتماد</span>
        </div>
      </section>
    </main>
  );
}
