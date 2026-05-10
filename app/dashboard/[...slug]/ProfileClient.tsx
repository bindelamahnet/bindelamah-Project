"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { CheckCircle2, KeyRound, Save, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type ProfileClientProps = {
  userId: string;
  email: string;
  fullName: string;
  homeSlug?: string;
};

type Notice = {
  type: "success" | "error";
  message: string;
};

export default function ProfileClient({ userId, email, fullName, homeSlug }: ProfileClientProps) {
  const router = useRouter();
  const [name, setName] = useState(fullName);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  function returnToHome() {
    if (!homeSlug) return;
    window.setTimeout(() => router.push(`/dashboard/${homeSlug}`), 1100);
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);

    if (!name.trim()) {
      setNotice({ type: "error", message: "يرجى إدخال الاسم." });
      return;
    }

    setSavingProfile(true);
    const supabase = createClient();
    const { error: profileError } = await supabase
      .from("user_profiles")
      .update({ full_name: name.trim() })
      .eq("id", userId);

    if (profileError) {
      setNotice({ type: "error", message: profileError.message });
      setSavingProfile(false);
      return;
    }

    await supabase.auth.updateUser({ data: { full_name: name.trim() } });
    setNotice({ type: "success", message: "تم حفظ التغييرات" });
    setSavingProfile(false);
    returnToHome();
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setNotice({ type: "error", message: "يرجى تعبئة جميع حقول كلمة المرور." });
      return;
    }

    if (newPassword.length < 8) {
      setNotice({ type: "error", message: "كلمة المرور الجديدة يجب ألا تقل عن 8 أحرف." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setNotice({ type: "error", message: "تأكيد كلمة المرور غير مطابق لكلمة المرور الجديدة." });
      return;
    }

    setSavingPassword(true);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: currentPassword });

    if (signInError) {
      setNotice({ type: "error", message: "كلمة المرور الحالية غير صحيحة." });
      setSavingPassword(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });

    if (updateError) {
      setNotice({ type: "error", message: updateError.message });
      setSavingPassword(false);
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setNotice({ type: "success", message: "تم حفظ التغييرات" });
    setSavingPassword(false);
    returnToHome();
  }

  return (
    <section className="profile-page" aria-label="الملف الشخصي">
      {notice ? (
        <div className={`profile-toast profile-toast-${notice.type}`} role="status">
          {notice.type === "success" ? <CheckCircle2 size={54} /> : null}
          <strong>{notice.message}</strong>
        </div>
      ) : null}

      <header className="profile-title">
        <div>
          <p>إعدادات الحساب للمشروع الحالي</p>
          <h2>
            <UserRound size={30} />
            الملف الشخصي
          </h2>
        </div>
      </header>

      <form className="profile-panel" onSubmit={saveProfile}>
        <div className="profile-panel-header">
          <UserRound size={20} />
          <h3>تحديث البيانات</h3>
        </div>

        <div className="profile-grid">
          <div className="profile-field">
            <label htmlFor="profileName">الاسم *</label>
            <input id="profileName" value={name} onChange={(event) => setName(event.target.value)} />
          </div>

          <div className="profile-field">
            <label htmlFor="profileEmail">البريد الإلكتروني *</label>
            <input id="profileEmail" type="email" value={email} readOnly />
          </div>
        </div>

        <div className="profile-actions">
          <button type="submit" className="profile-primary-button" disabled={savingProfile}>
            <Save size={18} />
            {savingProfile ? "جاري الحفظ..." : "حفظ التعديلات"}
          </button>
        </div>
      </form>

      <form className="profile-panel" onSubmit={changePassword}>
        <div className="profile-panel-header">
          <KeyRound size={20} />
          <h3>تغيير كلمة المرور</h3>
        </div>

        <div className="profile-grid profile-password-grid">
          <div className="profile-field">
            <label htmlFor="currentPassword">كلمة المرور الحالية *</label>
            <input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
            />
          </div>

          <div className="profile-field">
            <label htmlFor="newPassword">كلمة المرور الجديدة *</label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
            />
          </div>

          <div className="profile-field">
            <label htmlFor="confirmPassword">تأكيد كلمة المرور *</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
            />
          </div>
        </div>

        <div className="profile-actions">
          <button type="submit" className="profile-primary-button" disabled={savingPassword}>
            <KeyRound size={18} />
            {savingPassword ? "جاري التغيير..." : "تغيير كلمة المرور"}
          </button>
        </div>
      </form>
    </section>
  );
}
