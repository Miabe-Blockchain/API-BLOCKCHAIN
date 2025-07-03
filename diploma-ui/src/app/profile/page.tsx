"use client";

import Input from "@/components/Input";
import Button from "@/components/Button";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { updateProfile, changePassword } from "@/services/api";

export default function ProfilePage() {
  const { user, token, fetchProfile, loading: authLoading, setup2FA, verify2FA, disable2FA } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [show2FADisable, setShow2FADisable] = useState(false);
  const [qrData, setQrData] = useState<{ qrCode: string; secret: string } | null>(null);
  const [twoFACode, setTwoFACode] = useState("");
  const [twoFAError, setTwoFAError] = useState("");
  const [twoFASuccess, setTwoFASuccess] = useState("");
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [disable2FAPassword, setDisable2FAPassword] = useState("");
  const [disable2FACode, setDisable2FACode] = useState("");

  useEffect(() => {
    if (!token) {
      router.replace("/login");
      return;
    }
    if (user) {
      setForm({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
      });
    } else {
      fetchProfile();
    }
  }, [token, user, fetchProfile, router]);

  if (!token) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await updateProfile({
        first_name: form.firstName,
        last_name: form.lastName,
        // email non modifiable ici
      });
      setSuccess("Profil mis à jour avec succès.");
      fetchProfile();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    setPwSuccess("");
    if (passwords.new !== passwords.confirm) {
      setPwError("Les nouveaux mots de passe ne correspondent pas.");
      return;
    }
    setPwLoading(true);
    try {
      await changePassword(passwords.current, passwords.new);
      setPwSuccess("Mot de passe changé avec succès.");
      setPasswords({ current: "", new: "", confirm: "" });
      setShowPasswordForm(false);
    } catch (e: any) {
      setPwError(e.message);
    } finally {
      setPwLoading(false);
    }
  };

  // 2FA setup
  const handleSetup2FA = async () => {
    setTwoFAError("");
    setTwoFASuccess("");
    setTwoFALoading(true);
    try {
      const data = await setup2FA();
      setQrData({ qrCode: data.qrCode, secret: data.secret });
      setShow2FASetup(true);
    } catch (e: any) {
      setTwoFAError(e.message);
    } finally {
      setTwoFALoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setTwoFAError("");
    setTwoFASuccess("");
    setTwoFALoading(true);
    try {
      await verify2FA(twoFACode);
      setTwoFASuccess("2FA activé avec succès.");
      setShow2FASetup(false);
      setQrData(null);
      setTwoFACode("");
      fetchProfile();
    } catch (e: any) {
      setTwoFAError(e.message);
    } finally {
      setTwoFALoading(false);
    }
  };

  // 2FA disable
  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setTwoFAError("");
    setTwoFASuccess("");
    setTwoFALoading(true);
    try {
      await disable2FA(disable2FAPassword, disable2FACode);
      setTwoFASuccess("2FA désactivé avec succès.");
      setShow2FADisable(false);
      setDisable2FAPassword("");
      setDisable2FACode("");
      fetchProfile();
    } catch (e: any) {
      setTwoFAError(e.message);
    } finally {
      setTwoFALoading(false);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8">
      <div className="w-full max-w-lg bg-white rounded shadow p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">Mon profil</h1>
        {authLoading ? (
          <div className="text-gray-500">Chargement...</div>
        ) : error ? (
          <div className="text-red-600 text-center mb-4">{error}</div>
        ) : (
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <Input label="Prénom" name="firstName" required autoComplete="given-name" value={form.firstName} onChange={handleChange} />
            <Input label="Nom" name="lastName" required autoComplete="family-name" value={form.lastName} onChange={handleChange} />
            <Input label="Email" type="email" name="email" required autoComplete="email" value={form.email} readOnly />
            <Button type="submit" className="w-full mt-2" disabled={saving}>{saving ? "Enregistrement..." : "Enregistrer"}</Button>
            {success && <div className="text-green-600 text-center mt-2">{success}</div>}
          </form>
        )}
        <div className="flex flex-col gap-2 mt-6">
          <Button variant="secondary" onClick={() => setShowPasswordForm(v => !v)}>
            {showPasswordForm ? "Annuler" : "Changer le mot de passe"}
          </Button>
          {showPasswordForm && (
            <form className="flex flex-col gap-2 mt-2" onSubmit={handlePasswordSubmit}>
              <Input label="Mot de passe actuel" type="password" name="current" required value={passwords.current} onChange={handlePasswordChange} />
              <Input label="Nouveau mot de passe" type="password" name="new" required value={passwords.new} onChange={handlePasswordChange} />
              <Input label="Confirmer le nouveau mot de passe" type="password" name="confirm" required value={passwords.confirm} onChange={handlePasswordChange} />
              <Button type="submit" disabled={pwLoading}>{pwLoading ? "Changement..." : "Valider"}</Button>
              {(pwError || pwSuccess) && <div className={pwError ? "text-red-600" : "text-green-600" + " text-center mt-2"}>{pwError || pwSuccess}</div>}
            </form>
          )}
          <div className="mt-4">
            <div className="mb-2 font-semibold">Authentification à deux facteurs (2FA) : {user?.two_factor_enabled ? <span className="text-green-600">activée</span> : <span className="text-red-600">désactivée</span>}</div>
            {user?.two_factor_enabled ? (
              <>
                <Button variant="secondary" onClick={() => setShow2FADisable(v => !v)} disabled={twoFALoading}>
                  {show2FADisable ? "Annuler" : "Désactiver le 2FA"}
                </Button>
                {show2FADisable && (
                  <form className="flex flex-col gap-2 mt-2" onSubmit={handleDisable2FA}>
                    <Input label="Mot de passe" type="password" name="disable2FAPassword" required value={disable2FAPassword} onChange={e => setDisable2FAPassword(e.target.value)} />
                    <Input label="Code 2FA" type="text" name="disable2FACode" required value={disable2FACode} onChange={e => setDisable2FACode(e.target.value)} maxLength={6} />
                    <Button type="submit" disabled={twoFALoading}>{twoFALoading ? "Désactivation..." : "Valider"}</Button>
                  </form>
                )}
              </>
            ) : (
              <>
                <Button variant="secondary" onClick={handleSetup2FA} disabled={twoFALoading || show2FASetup}>
                  Activer le 2FA
                </Button>
                {show2FASetup && qrData && (
                  <div className="mt-2 flex flex-col items-center gap-2">
                    <img src={qrData.qrCode} alt="QR Code 2FA" className="w-32 h-32" />
                    <div className="text-xs text-gray-500">Clé manuelle : {qrData.secret}</div>
                    <form className="flex flex-col gap-2 mt-2" onSubmit={handleVerify2FA}>
                      <Input label="Code 2FA" type="text" name="twoFACode" required value={twoFACode} onChange={e => setTwoFACode(e.target.value)} maxLength={6} />
                      <Button type="submit" disabled={twoFALoading}>{twoFALoading ? "Activation..." : "Valider le code"}</Button>
                    </form>
                  </div>
                )}
              </>
            )}
            {(twoFAError || twoFASuccess) && <div className={twoFAError ? "text-red-600" : "text-green-600" + " text-center mt-2"}>{twoFAError || twoFASuccess}</div>}
          </div>
        </div>
      </div>
    </main>
  );
} 