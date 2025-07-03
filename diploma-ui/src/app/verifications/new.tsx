"use client";
import { useState } from "react";
import { createVerification } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import Input from "@/components/Input";
import Button from "@/components/Button";
import Link from "next/link";

export default function NewVerificationPage() {
  const { token, user } = useAuth();
  const [form, setForm] = useState({ diploma_hash: "", status: "valid", notes: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!token || !user || !["admin", "verificateur"].includes(user.role)) {
    return <div className="p-8 text-center">Accès réservé aux vérificateurs et admins.</div>;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await createVerification(form);
      setSuccess("Vérification enregistrée avec succès.");
      setForm({ diploma_hash: "", status: "valid", notes: "" });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8">
      <div className="w-full max-w-lg bg-white rounded shadow p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">Nouvelle vérification</h1>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <Input label="Hash du diplôme" name="diploma_hash" required value={form.diploma_hash} onChange={handleChange} />
          <select name="status" value={form.status} onChange={handleChange} className="border rounded p-2">
            <option value="valid">Valide</option>
            <option value="invalid">Invalide</option>
            <option value="pending">En attente</option>
          </select>
          <Input label="Notes" name="notes" value={form.notes} onChange={handleChange} />
          <Button type="submit" disabled={loading}>{loading ? "Enregistrement..." : "Enregistrer"}</Button>
        </form>
        {error && <div className="text-red-600 text-center mt-2">{error}</div>}
        {success && <div className="text-green-600 text-center mt-2">{success}</div>}
        <div className="flex justify-center mt-4">
          <Link href="/verifications" className="text-blue-600 hover:underline">Retour à l'historique</Link>
        </div>
      </div>
    </main>
  );
} 