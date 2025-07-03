"use client";
import { useEffect, useState } from "react";
import { getDiplomaStats } from "@/services/api";
import { useAuth } from "@/context/AuthContext";

export default function DiplomasStatsPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setError("");
    getDiplomaStats()
      .then(setStats)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (!token) return <div className="p-8 text-center">Veuillez vous connecter.</div>;

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-6">Statistiques des diplômes</h1>
      {loading ? (
        <div>Chargement...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : stats ? (
        <div className="flex flex-col gap-6">
          <div className="flex gap-8 mb-4">
            <div className="bg-gray-100 rounded p-4 text-center">
              <div className="text-lg font-bold">Total</div>
              <div className="text-2xl">{stats.total}</div>
            </div>
            <div className="bg-green-100 rounded p-4 text-center">
              <div className="text-lg font-bold">Enregistrés</div>
              <div className="text-2xl">{stats.registered}</div>
            </div>
            <div className="bg-yellow-100 rounded p-4 text-center">
              <div className="text-lg font-bold">En attente</div>
              <div className="text-2xl">{stats.pending}</div>
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-2">Par type</h2>
            <table className="min-w-full border">
              <thead><tr><th className="p-2 border">Type</th><th className="p-2 border">Nombre</th></tr></thead>
              <tbody>
                {stats.byType.map((t: any) => (
                  <tr key={t.diploma_type}><td className="border p-2">{t.diploma_type}</td><td className="border p-2">{t.count}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-2">Par année</h2>
            <table className="min-w-full border">
              <thead><tr><th className="p-2 border">Année</th><th className="p-2 border">Nombre</th></tr></thead>
              <tbody>
                {stats.byYear.map((y: any) => (
                  <tr key={y.year}><td className="border p-2">{y.year}</td><td className="border p-2">{y.count}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-2">Par institution</h2>
            <table className="min-w-full border">
              <thead><tr><th className="p-2 border">Institution</th><th className="p-2 border">Nombre</th></tr></thead>
              <tbody>
                {stats.byInstitution.map((i: any) => (
                  <tr key={i.issuer_institution}><td className="border p-2">{i.issuer_institution}</td><td className="border p-2">{i.count}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </main>
  );
} 