"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/Button";
import Input from "@/components/Input";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function BlockchainToolsPage() {
  const { token } = useAuth();

  // Détail transaction
  const [txHash, setTxHash] = useState("");
  const [txResult, setTxResult] = useState<any>(null);
  const [txLoading, setTxLoading] = useState(false);
  const [txError, setTxError] = useState("");

  // Estimation gas
  const [diplomaData, setDiplomaData] = useState("");
  const [gasResult, setGasResult] = useState<any>(null);
  const [gasLoading, setGasLoading] = useState(false);
  const [gasError, setGasError] = useState("");

  // Statut Etherscan
  const [ethHash, setEthHash] = useState("");
  const [ethResult, setEthResult] = useState<any>(null);
  const [ethLoading, setEthLoading] = useState(false);
  const [ethError, setEthError] = useState("");

  // Détail transaction
  const handleTxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTxLoading(true);
    setTxError("");
    setTxResult(null);
    try {
      const res = await fetch(`${API_URL}/blockchain/transaction/${txHash}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Transaction non trouvée");
      setTxResult(await res.json());
    } catch (e: any) {
      setTxError(e.message);
    } finally {
      setTxLoading(false);
    }
  };

  // Estimation gas
  const handleGasSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGasLoading(true);
    setGasError("");
    setGasResult(null);
    try {
      const res = await fetch(`${API_URL}/blockchain/estimate-gas`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: diplomaData,
      });
      if (!res.ok) throw new Error("Erreur d'estimation");
      setGasResult(await res.json());
    } catch (e: any) {
      setGasError(e.message);
    } finally {
      setGasLoading(false);
    }
  };

  // Statut Etherscan
  const handleEthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEthLoading(true);
    setEthError("");
    setEthResult(null);
    try {
      const res = await fetch(`${API_URL}/blockchain/etherscan/tx/${ethHash}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Transaction non trouvée sur Etherscan");
      setEthResult(await res.json());
    } catch (e: any) {
      setEthError(e.message);
    } finally {
      setEthLoading(false);
    }
  };

  if (!token) return <div className="p-8 text-center">Veuillez vous connecter.</div>;

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Outils blockchain</h1>
      {/* Détail transaction */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Détail d'une transaction</h2>
        <form className="flex gap-2 mb-2" onSubmit={handleTxSubmit}>
          <Input placeholder="Hash de transaction" value={txHash} onChange={e => setTxHash(e.target.value)} />
          <Button type="submit" disabled={txLoading}>Rechercher</Button>
        </form>
        {txError && <div className="text-red-600">{txError}</div>}
        {txResult && <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">{JSON.stringify(txResult, null, 2)}</pre>}
      </section>
      {/* Estimation gas */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Estimation du coût (gas) pour un diplôme</h2>
        <form className="flex flex-col gap-2 mb-2" onSubmit={handleGasSubmit}>
          <textarea className="border rounded p-2 font-mono text-xs" rows={4} placeholder="Données du diplôme (JSON)" value={diplomaData} onChange={e => setDiplomaData(e.target.value)} />
          <Button type="submit" disabled={gasLoading}>Estimer</Button>
        </form>
        {gasError && <div className="text-red-600">{gasError}</div>}
        {gasResult && <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">{JSON.stringify(gasResult, null, 2)}</pre>}
      </section>
      {/* Statut Etherscan */}
      <section>
        <h2 className="text-lg font-semibold mb-2">Statut d'une transaction via Etherscan</h2>
        <form className="flex gap-2 mb-2" onSubmit={handleEthSubmit}>
          <Input placeholder="Hash de transaction" value={ethHash} onChange={e => setEthHash(e.target.value)} />
          <Button type="submit" disabled={ethLoading}>Vérifier</Button>
        </form>
        {ethError && <div className="text-red-600">{ethError}</div>}
        {ethResult && <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">{JSON.stringify(ethResult, null, 2)}</pre>}
      </section>
    </main>
  );
} 