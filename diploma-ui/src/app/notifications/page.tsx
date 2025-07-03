"use client";
import { useEffect, useState } from "react";
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/Button";
import Badge from "@/components/Badge";

export default function NotificationsPage() {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showDetail, setShowDetail] = useState<any>(null);
  const [marking, setMarking] = useState(false);

  const fetchNotifications = () => {
    if (!token) return;
    setLoading(true);
    setError("");
    getNotifications({ page })
      .then(data => {
        setNotifications(data.notifications || []);
        setTotalPages(data.pagination?.totalPages || 1);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line
  }, [token, page]);

  const handleMarkRead = async (id: string) => {
    setMarking(true);
    await markNotificationRead(id);
    fetchNotifications();
    setMarking(false);
  };

  const handleMarkAllRead = async () => {
    setMarking(true);
    await markAllNotificationsRead();
    fetchNotifications();
    setMarking(false);
  };

  if (!token) return <div className="p-8 text-center">Veuillez vous connecter.</div>;

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-6">Notifications</h1>
      <div className="flex justify-end mb-4">
        <Button onClick={handleMarkAllRead} disabled={marking}>Tout marquer comme lu</Button>
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
                <th className="p-2 border">Titre</th>
                <th className="p-2 border">Message</th>
                <th className="p-2 border">Date</th>
                <th className="p-2 border">Statut</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {notifications.length === 0 ? (
                <tr><td colSpan={5} className="text-center p-4">Aucune notification.</td></tr>
              ) : notifications.map((n: any) => (
                <tr key={n.id} className={n.read ? "" : "bg-blue-50"}>
                  <td className="border p-2">{n.title}</td>
                  <td className="border p-2">{n.message}</td>
                  <td className="border p-2">{n.created_at ? n.created_at.slice(0, 19).replace("T", " ") : ""}</td>
                  <td className="border p-2">
                    {n.read ? (
                      <Badge type="success">Lue</Badge>
                    ) : (
                      <Badge type="info">Non lue</Badge>
                    )}
                  </td>
                  <td className="border p-2 flex gap-2">
                    <Button variant="secondary" onClick={() => setShowDetail(n)}>Voir</Button>
                    {!n.read && <Button onClick={() => handleMarkRead(n.id)} disabled={marking}>Marquer comme lue</Button>}
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
      {showDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow p-8 w-full max-w-md relative">
            <button className="absolute top-2 right-2 text-xl" onClick={() => setShowDetail(null)}>&times;</button>
            <h2 className="text-xl font-bold mb-4">Détail de la notification</h2>
            <div className="mb-2"><b>Titre :</b> {showDetail.title}</div>
            <div className="mb-2"><b>Message :</b> {showDetail.message}</div>
            <div className="mb-2"><b>Date :</b> {showDetail.created_at ? showDetail.created_at.slice(0, 19).replace("T", " ") : ""}</div>
            <div className="mb-2"><b>Statut :</b> {showDetail.read ? <Badge type="success">Lue</Badge> : <Badge type="info">Non lue</Badge>}</div>
            <div className="mb-2"><b>Données :</b> <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">{JSON.stringify(showDetail.data, null, 2)}</pre></div>
            <div className="flex justify-end mt-4">
              <Button variant="secondary" onClick={() => setShowDetail(null)}>Fermer</Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
} 