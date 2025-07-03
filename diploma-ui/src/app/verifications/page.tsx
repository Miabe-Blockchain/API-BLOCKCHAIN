"use client";
import { useEffect, useState } from "react";
import { getVerifications } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import Input from "@/components/Input";
import Button from "@/components/Button";

export default function VerificationsPage() {
  const { token } = useAuth();
  const [verifications, setVerifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setError("");
    getVerifications({ page, status, date_from: dateFrom, date_to: dateTo })
      .then(data => {
        setVerifications(data.verifications || []);
        setTotalPages(data.pagination?.totalPages || 1);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [token, page, status, dateFrom, dateTo]);

  if (!token) return <div className="p-8 text-center">Veuillez vous connecter.</div>;

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-6">Historique des vérifications</h1>
      <div className="flex gap-4 mb-4">
        <Input placeholder="Statut (valid, invalid, pending)" value={status} onChange={e => setStatus(e.target.value)} />
        <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        <Button onClick={() => setPage(1)}>Filtrer</Button>
      </div>
      {loading ? (
        <div>Chargement...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">Date</th>
                <th className="p-2 border">Statut</th>
                <th className="p-2 border">Hash diplôme</th>
                <th className="p-2 border">Notes</th>
              </tr>
            </thead>
            <tbody>
              {verifications.length === 0 ? (
                <tr><td colSpan={4} className="text-center p-4">Aucune vérification trouvée.</td></tr>
              ) : verifications.map((v: any) => (
                <tr key={v.id}>
                  <td className="border p-2">{v.verified_at ? v.verified_at.slice(0, 19).replace("T", " ") : ""}</td>
                  <td className="border p-2">{v.status}</td>
                  <td className="border p-2">{v.diploma_hash}</td>
                  <td className="border p-2">{v.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="flex gap-2 justify-center mt-4">
        <Button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Précédent</Button>
        <span>Page {page} / {totalPages}</span>
        <Button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Suivant</Button>
      </div>
    </main>
  );
} 