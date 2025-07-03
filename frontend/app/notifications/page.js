"use client";
import { useEffect, useState } from 'react';
import { Card, Button, Alert, Spinner, ListGroup, Badge } from 'react-bootstrap';
import { FaCheck, FaTrash, FaBell } from 'react-icons/fa';
import { useAuth } from '../AuthContext';

const API_URL = 'http://localhost:5000/api';

export default function NotificationsPage() {
  const { isLoggedIn } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/notifications`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Erreur lors du chargement des notifications.');
      const data = await response.json();
      setNotifications(data.notifications || data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (isLoggedIn) fetchNotifications(); }, [isLoggedIn]);

  const markAsRead = async (id) => {
    await fetch(`${API_URL}/notifications/${id}/read`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    fetchNotifications();
  };

  const deleteNotification = async (id) => {
    await fetch(`${API_URL}/notifications/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    fetchNotifications();
  };

  if (!isLoggedIn) {
    return <Alert variant="warning">Vous devez être connecté pour accéder à cette page.</Alert>;
  }

  return (
    <div className="container" style={{ maxWidth: 600 }}>
      <h3 className="mb-4"><FaBell className="me-2" />Notifications</h3>
      {loading ? <Spinner animation="border" /> : error ? <Alert variant="danger">{error}</Alert> : notifications.length === 0 ? (
        <Alert variant="info">Aucune notification.</Alert>
      ) : (
        <Card>
          <ListGroup variant="flush">
            {notifications.map(n => (
              <ListGroup.Item key={n.id} className="d-flex align-items-center justify-content-between">
                <div>
                  <span className={n.read ? 'text-muted' : 'fw-bold'}>{n.message}</span>
                  <br />
                  <small className="text-muted">{new Date(n.created_at).toLocaleString('fr-FR')}</small>
                  {!n.read && <Badge bg="danger" className="ms-2">Non lu</Badge>}
                </div>
                <div className="d-flex gap-2">
                  {!n.read && <Button size="sm" variant="outline-success" onClick={() => markAsRead(n.id)} title="Marquer comme lue"><FaCheck /></Button>}
                  <Button size="sm" variant="outline-danger" onClick={() => deleteNotification(n.id)} title="Supprimer"><FaTrash /></Button>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Card>
      )}
    </div>
  );
} 