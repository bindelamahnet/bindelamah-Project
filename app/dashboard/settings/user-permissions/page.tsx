import UserPermissionsClient from "./UserPermissionsClient";

export default function UserPermissionsSettingsPage() {
  return (
    <main className="content-page">
      <header className="page-header">
        <p>إعدادات النظام</p>
        <h2>صلاحيات المستخدمون</h2>
        <span>إعداد صلاحيات المستخدمين للنظام، وربط الأدوار بالقوائم والشاشات.</span>
      </header>

      <UserPermissionsClient />
    </main>
  );
}
