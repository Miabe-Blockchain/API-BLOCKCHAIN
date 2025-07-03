"use client";

import Input from "@/components/Input";
import Button from "@/components/Button";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const { register, loading, error, token } = useAuth();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [localError, setLocalError] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (token) {
      router.replace("/dashboard");
    }
  }, [token, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    if (form.password !== form.confirmPassword) {
      setLocalError("Les mots de passe ne correspondent pas.");
      return;
    }
    await register({
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      password: form.password,
    });
    // Redirection automatique via useEffect
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8">
      <div className="w-full max-w-md bg-white rounded shadow p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">Inscription</h1>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <Input label="Prénom" name="firstName" required autoComplete="given-name" value={form.firstName} onChange={handleChange} />
          <Input label="Nom" name="lastName" required autoComplete="family-name" value={form.lastName} onChange={handleChange} />
          <Input label="Email" type="email" name="email" required autoComplete="email" value={form.email} onChange={handleChange} />
          <Input label="Mot de passe" type="password" name="password" required autoComplete="new-password" value={form.password} onChange={handleChange} />
          <Input label="Confirmer le mot de passe" type="password" name="confirmPassword" required autoComplete="new-password" value={form.confirmPassword} onChange={handleChange} />
          <Button type="submit" className="w-full mt-2" disabled={loading}>
            {loading ? "Inscription..." : "S'inscrire"}
          </Button>
        </form>
        {(localError || error) && <div className="text-red-600 text-center mt-2">{localError || error}</div>}
        <div className="flex justify-center mt-4 text-sm">
          <span>Déjà un compte ? </span>
          <Link href="/login" className="ml-1 text-blue-600 hover:underline">Connexion</Link>
        </div>
      </div>
    </main>
  );
} 