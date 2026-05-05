"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, LogIn, Mail, MessageCircle, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Company = {
  id: string;
  name_ar: string;
  name_en: string | null;
  group_no: number;
};

type Project = {
  id: string;
  company_id: string;
  project_no: string | null;
  name_ar: string;
  project_type: string;
};

export default function LoginPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [companyId, setCompanyId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/context/options")
      .then((res) => res.json())
      .then((data) => {
        setCompanies(data.companies ?? []);
        setProjects(data.projects ?? []);
        if (data.companies?.[0]) setCompanyId(data.companies[0].id);
      })
      .catch(() => setError("تعذر تحميل الشركات والمشاريع."));
  }, []);

  const filteredProjects = useMemo(
    () => projects.filter((project) => project.company_id === companyId),
    [companyId, projects]
  );

  useEffect(() => {
    setProjectId(filteredProjects[0]?.id ?? "");
  }, [filteredProjects]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    const contextResponse = await fetch("/api/context", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company_id: companyId, project_id: projectId })
    });

    if (!contextResponse.ok) {
      const data = await contextResponse.json().catch(() => ({}));
      setError(data.error ?? "تم تسجيل الدخول، لكن تعذر حفظ سياق الشركة والمشروع.");
      setLoading(false);
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <main className="login-page">
      <section className="login-panel" aria-label="تسجيل الدخول">
        <div className="login-brand">
          <img className="brand-logo" src="/bdcc-logo.jpg" alt="BDCC" />
          <h1>شركة بن دلامة للمقاولات</h1>
          <p>نظام إدارة العقود</p>
        </div>

        <form onSubmit={onSubmit} className="login-form">
          <div className="field login-field">
            <label htmlFor="email">
              <User size={15} />
              Username اسم المستخدم
            </label>
            <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </div>

          <div className="field login-field">
            <label htmlFor="password">
              <Lock size={15} />
              Password كلمة المرور
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          <label className="remember-row" htmlFor="remember">
            <input
              id="remember"
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
            />
            <span>Remember me تذكرني</span>
          </label>

          <a className="forgot-link" href="mailto:support@bindelamah.net">
            نسيت كلمة المرور / Forgot Password?
          </a>

          {error ? <div className="error">{error}</div> : null}

          <button className="button login-submit" type="submit" disabled={loading}>
            <LogIn size={18} />
            {loading ? "جاري الدخول..." : "Login تسجيل الدخول"}
          </button>

          <div className="login-support">
            <a className="whatsapp-support" href="https://wa.me/" target="_blank" rel="noreferrer">
              <MessageCircle size={15} />
              الدعم عبر الواتساب
            </a>
            <a href="mailto:support@bindelamah.net">
              support@bindelamah.net
              <Mail size={15} />
            </a>
          </div>
        </form>
      </section>
    </main>
  );
}
