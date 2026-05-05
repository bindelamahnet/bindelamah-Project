import Link from "next/link";

export default function SystemSettingsPage() {
  return (
    <main className="content-page">
      <header className="page-header">
        <p>إعدادات النظام</p>
        <h2>لوحة إعدادات BDCC ERP</h2>
        <span>إدارة إعدادات النظام العامة، الصلاحيات، المستخدمين، وربط الخدمات.</span>
      </header>

      <section className="settings-grid" aria-label="خيارات إعدادات النظام">
        <Link href="/dashboard/settings/user-permissions" className="settings-card">
          <h3>صلاحيات المستخدمون</h3>
          <p>إعداد صلاحيات المستخدمين والأدوار والوصول إلى شاشات النظام.</p>
        </Link>
      </section>
    </main>
  );
}
