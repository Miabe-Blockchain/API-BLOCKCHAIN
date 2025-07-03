"use client";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DataTable from "@/components/DataTable";

const columns = [
  { key: "firstName", label: "Prénom" },
  { key: "lastName", label: "Nom" },
  { key: "email", label: "Email" },
  { key: "role", label: "Rôle" },
  { key: "status", label: "Statut" },
  { key: "actions", label: "Actions" },
];

export default function AdminPage() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      router.replace("/login");
      return;
    }
    // Protection admin
    if (user && user.role !== "admin") {
      router.replace("/dashboard");
      return;
    }
    const fetchUsers = async () => {
      setLoading(true);
      setError("");
      try {
        const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
        const headers = { Authorization: `Bearer ${token}` };
        const res = await fetch(`${api}/admin/users`, { headers });
        if (!res.ok) throw new Error("Impossible de charger les utilisateurs.");
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : data.rows || []);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [token, user, router]);

  if (!token || (user && user.role !== "admin")) return null;

  const tableData = users.map((u: any) => ({
    ...u,
    actions: (
      <button className="text-blue-600 hover:underline" onClick={() => router.push(`/admin/users/${u.id}`)}>
        Voir
      </button>
    ),
  }));

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-6">Administration</h1>
      {loading ? (
        <div className="text-gray-500">Chargement...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <DataTable columns={columns} data={tableData} emptyMessage="Aucun utilisateur pour le moment." />
      )}
    </main>
  );
} 