"use client";
import { useState, useEffect } from 'react';
import { Table, Form, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../../AuthContext';

const API_URL = 'http://localhost:5000/api';

export default function AdminUsersPanel() {
  const { user, isLoggedIn } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isLoggedIn) {
      setError("Vous devez être connecté pour accéder à cette page.");
      setLoading(false);
      return;
    }
    if (user?.role !== 'admin') {
      setError("Accès interdit : vous n'avez pas les droits nécessaires (admin requis).");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    fetch(`${API_URL}/admin/users`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(async res => {
        if (res.status === 403) throw new Error("Accès interdit : vous n'avez pas les droits nécessaires ou votre session a expiré.");
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || 'Erreur lors du chargement des utilisateurs.');
        }
        return res.json();
      })
      .then(data => setUsers(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [isLoggedIn, user]);

  if (!isLoggedIn) {
    return <Alert variant="warning">Vous devez être connecté pour accéder à cette page.</Alert>;
  }
  if (user?.role !== 'admin') {
    return <Alert variant="danger">Accès interdit : vous n'avez pas les droits nécessaires (admin requis).</Alert>;
  }

  const handleRoleChange = async (userId, newRole) => {
    try {
      const response = await fetch(`${API_URL}/admin/update-role/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ role: newRole })
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Impossible de mettre à jour le rôle.');
      }
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="text-center"><Spinner animation="border" /> <p>Chargement des utilisateurs...</p></div>;
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <div>
      <h3 className="mb-4">Gestion des utilisateurs</h3>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Nom</th>
            <th>Email</th>
            <th>Rôle actuel</th>
            <th>Changer le rôle</th>
            <th>Statut</th>
            <th>Inscrit le</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.first_name} {user.last_name}</td>
              <td>{user.email}</td>
              <td><span className={`badge bg-${user.role === 'admin' ? 'danger' : 'secondary'}`}>{user.role}</span></td>
              <td>
                <Form.Select size="sm" value={user.role} onChange={e => handleRoleChange(user.id, e.target.value)} disabled={user.role === 'admin'}>
                  <option value="emetteur">Émetteur</option>
                  <option value="verificateur">Vérificateur</option>
                  <option value="admin">Admin</option>
                </Form.Select>
              </td>
              <td><span className={`badge bg-${user.status === 'active' ? 'success' : 'warning'}`}>{user.status}</span></td>
              <td>{new Date(user.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
} 