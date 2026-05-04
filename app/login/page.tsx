"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, LogIn } from "lucide-react";
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
          <span className="brand-mark">
            <Building2 size={26} />
          </span>
          <div>
            <h1>BDCC ERP</h1>
            <p>بوابة مجموعة شركات بن دلامة</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="login-form">
          <div className="field">
            <label htmlFor="company">الشركة</label>
            <select id="company" value={companyId} onChange={(event) => setCompanyId(event.target.value)} required>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name_ar}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="project">المشروع</label>
            <select id="project" value={projectId} onChange={(event) => setProjectId(event.target.value)}>
              <option value="">بدون مشروع محدد</option>
              {filteredProjects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.project_no ? `${project.project_no} - ${project.name_ar}` : project.name_ar}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="email">البريد الإلكتروني</label>
            <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </div>

          <div className="field">
            <label htmlFor="password">كلمة المرور</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          {error ? <div className="error">{error}</div> : null}

          <button className="button" type="submit" disabled={loading}>
            <LogIn size={18} />
            {loading ? "جاري الدخول..." : "دخول النظام"}
          </button>
        </form>
      </section>
    </main>
  );
}
