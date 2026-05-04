import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BDCC ERP",
  description: "Production-ready BDCC ERP portal with Supabase RBAC"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
