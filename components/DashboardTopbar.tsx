"use client";

import { useEffect, useMemo, useState } from "react";
import { Languages, LogOut, UserCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate?: {
        TranslateElement?: new (options: Record<string, unknown>, elementId: string) => void;
      };
    };
  }
}

const languages = [
  { code: "ar", label: "AR" },
  { code: "en", label: "EN" },
  { code: "ur", label: "UR" },
  { code: "hi", label: "HI" },
  { code: "bn", label: "BN" },
  { code: "fil", label: "FIL" }
];

function applyGoogleLanguage(language: string) {
  const combo = document.querySelector<HTMLSelectElement>(".goog-te-combo");
  if (!combo) return;
  combo.value = language;
  combo.dispatchEvent(new Event("change"));
}

export default function DashboardTopbar({
  userName,
  jobTitle
}: {
  userName: string;
  jobTitle: string;
}) {
  const [language, setLanguage] = useState("ar");
  const initials = useMemo(() => userName.trim().slice(0, 2).toUpperCase() || "BD", [userName]);

  useEffect(() => {
    if (document.getElementById("google-translate-script")) return;

    window.googleTranslateElementInit = () => {
      if (!window.google?.translate?.TranslateElement) return;
      new window.google.translate.TranslateElement(
        {
          pageLanguage: "ar",
          includedLanguages: languages.map((item) => item.code).join(","),
          autoDisplay: false
        },
        "google_translate_element"
      );
    };

    const script = document.createElement("script");
    script.id = "google-translate-script";
    script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <header className="dashboard-topbar" dir="rtl">
      <button type="button" className="topbar-logout" onClick={signOut}>
        <LogOut size={18} />
        خروج
      </button>

      <div className="language-switcher" aria-label="تغيير اللغة">
        <Languages size={18} />
        <select
          value={language}
          onChange={(event) => {
            setLanguage(event.target.value);
            applyGoogleLanguage(event.target.value);
          }}
        >
          {languages.map((item) => (
            <option key={item.code} value={item.code}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      <div className="topbar-user-card">
        <div className="topbar-avatar" aria-hidden="true">
          {initials}
        </div>
        <div>
          <strong>{userName}</strong>
          <span>{jobTitle}</span>
        </div>
        <UserCircle size={26} />
      </div>

      <div id="google_translate_element" className="google-translate-slot" />
    </header>
  );
}
