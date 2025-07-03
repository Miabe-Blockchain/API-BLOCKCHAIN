"use client";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";

export default function WalletPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [wallet, setWallet] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!token) {
      router.replace("/login");
      return;
    }
    const fetchWallet = async () => {
      setLoading(true);
      setError("");
      setSuccess("");
      try {
        const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
        const headers = { Authorization: `Bearer ${token}` };
        const res = await fetch(`${api}/users/profile`, { headers });
        if (!res.ok) throw new Error("Impossible de charger le profil utilisateur.");
        const data = await res.json();
        setWallet(data.wallet_address || null);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchWallet();
  }, [token, router]);

  if (!token) return null;

  const handleConnect = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      // Ici, on simule la connexion d'un wallet (dans un vrai projet, il faudrait utiliser web3/metamask côté client)
      const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };
      // Pour la démo, on envoie une adresse factice
      const res = await fetch(`${api}/users/connect-wallet`, {
        method: "POST",
        headers,
        body: JSON.stringify({ wallet_address: "0x1234567890abcdef" }),
      });
      if (!res.ok) throw new Error("Impossible de connecter le wallet.");
      setSuccess("Wallet connecté avec succès.");
      setWallet("0x1234567890abcdef");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const headers = { Authorization: `Bearer ${token}` };
      const res = await fetch(`${api}/users/disconnect-wallet`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok) throw new Error("Impossible de déconnecter le wallet.");
      setSuccess("Wallet déconnecté.");
      setWallet(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8">
      <div className="w-full max-w-lg bg-white rounded shadow p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">Portefeuille</h1>
        {loading ? (
          <div className="text-gray-500">Chargement...</div>
        ) : error ? (
          <div className="text-red-600 text-center mb-4">{error}</div>
        ) : (
          <>
            <div className="mb-6 text-center">
              {wallet ? (
                <>
                  <div className="text-gray-700 mb-2">Adresse connectée :</div>
                  <div className="font-mono text-blue-700 mb-4">{wallet}</div>
                  <Button variant="danger" onClick={handleDisconnect} disabled={loading}>Déconnecter</Button>
                </>
              ) : (
                <Button variant="primary" onClick={handleConnect} disabled={loading}>Connecter un wallet</Button>
              )}
            </div>
            {success && <div className="text-green-600 text-center mt-2">{success}</div>}
          </>
        )}
      </div>
    </main>
  );
} 