"use client";
import { useEffect, useState } from "react";
import { getAnalytics } from "@/services/api";
import { useAuth } from "@/context/AuthContext";

export default function AdminAnalyticsPage() {
  const { token, user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token || !user || user.role !== "admin") return;
    setLoading(true);
    setError("");
    getAnalytics()
      .then(setStats)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [token, user]);

  if (!token || !user || user.role !== "admin") {
    return <div className="p-8 text-center">Accès réservé aux administrateurs.</div>;
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-6">Analytics</h1>
      {loading ? (
        <div>Chargement...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : stats ? (
        <div className="flex gap-8">
          <div className="bg-gray-100 rounded p-6 text-center">
            <div className="text-lg font-bold">Utilisateurs</div>
            <div className="text-2xl">{stats.users}</div>
          </div>
          <div className="bg-blue-100 rounded p-6 text-center">
            <div className="text-lg font-bold">Diplômes</div>
            <div className="text-2xl">{stats.diplomas}</div>
          </div>
          <div className="bg-green-100 rounded p-6 text-center">
            <div className="text-lg font-bold">Vérifications</div>
            <div className="text-2xl">{stats.verifications}</div>
          </div>
          <div className="bg-yellow-100 rounded p-6 text-center">
            <div className="text-lg font-bold">Transactions blockchain</div>
            <div className="text-2xl">{stats.transactions}</div>
          </div>
        </div>
      ) : null}
    </main>
  );
} 