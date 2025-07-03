"use client";

import { useState } from "react";
import { verifyDiplomaByHash } from "@/services/api";
import Input from "@/components/Input";
import Button from "@/components/Button";

export default function PublicVerifyPage() {
  const [hash, setHash] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const data = await verifyDiplomaByHash(hash);
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8">
      <div className="w-full max-w-lg bg-white rounded shadow p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">Vérification d'un diplôme</h1>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <Input label="Hash du diplôme" name="hash" required value={hash} onChange={e => setHash(e.target.value)} />
          <Button type="submit" disabled={loading}>{loading ? "Vérification..." : "Vérifier"}</Button>
        </form>
        {error && <div className="text-red-600 text-center mt-4">{error}</div>}
        {result && (
          <div className="mt-6">
            {result.valid ? (
              <div className="text-green-700 font-bold mb-2">Diplôme authentique !</div>
            ) : (
              <div className="text-red-700 font-bold mb-2">Diplôme non valide.</div>
            )}
            {result.diploma && (
              <div className="mt-2 text-sm">
                <div><b>Nom :</b> {result.diploma.diploma_name}</div>
                <div><b>Étudiant :</b> {result.diploma.student_firstname} {result.diploma.student_lastname}</div>
                <div><b>Type :</b> {result.diploma.diploma_type}</div>
                <div><b>Date d'émission :</b> {result.diploma.emission_date?.slice(0, 10)}</div>
                <div><b>Institution :</b> {result.diploma.issuer_institution}</div>
                {result.diploma.blockchain_registered_at && <div className="text-green-600">Enregistré sur la blockchain</div>}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
} 