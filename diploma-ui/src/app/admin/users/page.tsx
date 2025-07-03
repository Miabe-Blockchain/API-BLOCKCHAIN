"use client";
import { useEffect, useState } from "react";
import { getUsers, getRoles, updateUserRole, updateUserStatus, suspendUser } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import Input from "@/components/Input";
import Button from "@/components/Button";

export default function AdminUsersPage() {
  const { token, user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roles, setRoles] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!token || !user || user.role !== "admin") return;
    setLoading(true);
    setError("");
    getUsers({ page, search, role: roleFilter, status: statusFilter })
      .then(data => {
        setUsers(data.users || []);
        setTotalPages(data.pagination?.totalPages || 1);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [token, user, page, search, roleFilter, statusFilter]);

  useEffect(() => {
    if (!token || !user || user.role !== "admin") return;
    getRoles().then(data => setRoles(data.roles || []));
  }, [token, user]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setActionLoading(userId + "-role");
    setSuccess("");
    try {
      await updateUserRole(userId, newRole);
      setSuccess("Rôle mis à jour.");
      setUsers(users => users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading("");
    }
  };

  const handleStatusChange = async (userId: string, newStatus: string) => {
    setActionLoading(userId + "-status");
    setSuccess("");
    try {
      await updateUserStatus(userId, newStatus);
      setSuccess("Statut mis à jour.");
      setUsers(users => users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading("");
    }
  };

  const handleSuspend = async (userId: string) => {
    const reason = window.prompt("Raison de la suspension ?");
    if (!reason) return;
    setActionLoading(userId + "-suspend");
    setSuccess("");
    try {
      await suspendUser(userId, reason);
      setSuccess("Utilisateur suspendu.");
      setUsers(users => users.map(u => u.id === userId ? { ...u, status: "suspended" } : u));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading("");
    }
  };

  if (!token || !user || user.role !== "admin") {
    return <div className="p-8 text-center">Accès réservé aux administrateurs.</div>;
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-6">Gestion des utilisateurs</h1>
      <div className="flex gap-4 mb-4">
        <Input placeholder="Recherche (nom, email...)" value={search} onChange={e => setSearch(e.target.value)} />
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="border rounded p-2">
          <option value="">Tous rôles</option>
          {roles.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border rounded p-2">
          <option value="">Tous statuts</option>
          <option value="active">Actif</option>
          <option value="inactive">Inactif</option>
          <option value="suspended">Suspendu</option>
        </select>
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
                <th className="p-2 border">Nom</th>
                <th className="p-2 border">Email</th>
                <th className="p-2 border">Rôle</th>
                <th className="p-2 border">Statut</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={5} className="text-center p-4">Aucun utilisateur trouvé.</td></tr>
              ) : users.map((u: any) => (
                <tr key={u.id}>
                  <td className="border p-2">{u.first_name} {u.last_name}</td>
                  <td className="border p-2">{u.email}</td>
                  <td className="border p-2">
                    <select value={u.role} onChange={e => handleRoleChange(u.id, e.target.value)} disabled={actionLoading === u.id + "-role"} className="border rounded p-1">
                      {roles.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </td>
                  <td className="border p-2">
                    <select value={u.status} onChange={e => handleStatusChange(u.id, e.target.value)} disabled={actionLoading === u.id + "-status"} className="border rounded p-1">
                      <option value="active">Actif</option>
                      <option value="inactive">Inactif</option>
                      <option value="suspended">Suspendu</option>
                    </select>
                  </td>
                  <td className="border p-2 flex gap-2">
                    <Button variant="danger" onClick={() => handleSuspend(u.id)} disabled={actionLoading === u.id + "-suspend" || u.status === "suspended"}>Suspendre</Button>
                  </td>
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
      {success && <div className="text-green-600 text-center mt-4">{success}</div>}
    </main>
  );
} 