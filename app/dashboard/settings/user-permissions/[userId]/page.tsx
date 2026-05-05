import MenuPermissionsClient from "./MenuPermissionsClient";

type PageProps = {
  params: Promise<{ userId: string }>;
};

export default async function UserMenuPermissionsPage({ params }: PageProps) {
  const { userId } = await params;

  return (
    <main className="content-page">
      <header className="page-header">
        <p>إعدادات النظام</p>
        <h2>صلاحيات المستخدم</h2>
        <span>تحديد القوائم التي تظهر للمستخدم داخل النظام والتحكم في السماح أو الحجب.</span>
      </header>

      <MenuPermissionsClient userId={userId} />
    </main>
  );
}
