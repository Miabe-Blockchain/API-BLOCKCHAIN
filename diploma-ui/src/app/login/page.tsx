"use client";
import Input from "@/components/Input";
import Button from "@/components/Button";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { login, loading, error, token, twoFARequired, verify2FA } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twoFACode, setTwoFACode] = useState("");
  const [localError, setLocalError] = useState("");
  const router = useRouter();

  // Redirection si déjà connecté
  useEffect(() => {
    if (token) {
      router.replace("/dashboard");
    }
  }, [token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    await login(email, password);
    // La redirection se fait automatiquement via le useEffect ci-dessus
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    if (!twoFACode || twoFACode.length !== 6) {
      setLocalError("Veuillez saisir le code 2FA à 6 chiffres.");
      return;
    }
    try {
      await verify2FA(twoFACode);
      // Redirection automatique via useEffect
    } catch (e: any) {
      setLocalError(e.message);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8">
      <div className="w-full max-w-md bg-white rounded shadow p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">Connexion</h1>
        {twoFARequired ? (
          <form className="flex flex-col gap-4" onSubmit={handle2FASubmit}>
            <Input
              label="Code 2FA"
              type="text"
              name="twoFACode"
              required
              autoComplete="one-time-code"
              value={twoFACode}
              onChange={e => setTwoFACode(e.target.value)}
              maxLength={6}
            />
            <Button type="submit" className="w-full mt-2" disabled={loading}>
              {loading ? "Vérification..." : "Valider le code"}
            </Button>
          </form>
        ) : (
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <Input
              label="Email"
              type="email"
              name="email"
              required
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <Input
              label="Mot de passe"
              type="password"
              name="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <Button type="submit" className="w-full mt-2" disabled={loading}>
              {loading ? "Connexion..." : "Se connecter"}
            </Button>
          </form>
        )}
        {(localError || error) && <div className="text-red-600 text-center mt-2">{localError || error}</div>}
        <div className="flex justify-between mt-4 text-sm">
          <Link href="/forgot-password" className="text-blue-600 hover:underline">
            Mot de passe oublié ?
          </Link>
          <Link href="/register" className="text-gray-600 hover:underline">
            Créer un compte
          </Link>
        </div>
      </div>
    </main>
  );
} 