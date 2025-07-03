"use client";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [diplomaCount, setDiplomaCount] = useState<number | null>(null);
  const [verifCount, setVerifCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      router.replace("/login");
      return;
    }
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
        const headers = { Authorization: `Bearer ${token}` };
        // Profil utilisateur
        const resProfile = await fetch(`${api}/users/profile`, { headers });
        if (!resProfile.ok) throw new Error("Impossible de charger le profil utilisateur.");
        setProfile(await resProfile.json());
        // Nombre de diplômes
        const resDiplomas = await fetch(`${api}/diplomas`, { headers });
        if (!resDiplomas.ok) throw new Error("Impossible de charger les diplômes.");
        const diplomas = await resDiplomas.json();
        setDiplomaCount(Array.isArray(diplomas) ? diplomas.length : (diplomas.count || 0));
        // Nombre de vérifications
        const resVerif = await fetch(`${api}/verifications`, { headers });
        if (!resVerif.ok) throw new Error("Impossible de charger les vérifications.");
        const verifs = await resVerif.json();
        setVerifCount(Array.isArray(verifs) ? verifs.length : (verifs.count || 0));
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token, router]);

  if (!token) return null;

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-6">Tableau de bord</h1>
      {loading ? (
        <div className="text-gray-500">Chargement...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded shadow p-6">
            <h2 className="text-xl font-semibold mb-2">Bienvenue, {profile?.firstName || profile?.email} !</h2>
            <div className="text-gray-700">Rôle : {profile?.role || "Utilisateur"}</div>
            <div className="text-gray-700">Email : {profile?.email}</div>
          </div>
          <div className="flex gap-6">
            <div className="bg-blue-100 rounded p-4 flex-1 text-center">
              <div className="text-2xl font-bold">{diplomaCount ?? "-"}</div>
              <div className="text-gray-700">Diplômes enregistrés</div>
            </div>
            <div className="bg-green-100 rounded p-4 flex-1 text-center">
              <div className="text-2xl font-bold">{verifCount ?? "-"}</div>
              <div className="text-gray-700">Vérifications effectuées</div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
} 