"use client";
import { useState, useEffect } from 'react';
import { Table, Button, Form, Alert, Spinner, Modal, InputGroup } from 'react-bootstrap';
import { useAuth } from '../../AuthContext';

const API_URL = 'http://localhost:5000/api';

export default function AdminRolesPanel() {
  const { user, isLoggedIn } = useAuth();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentRole, setCurrentRole] = useState({ id: null, name: '' });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

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
    fetch(`${API_URL}/admin/roles`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(async res => {
        if (res.status === 403) throw new Error("Accès interdit : vous n'avez pas les droits nécessaires ou votre session a expiré.");
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || 'Erreur lors du chargement des rôles.');
        }
        return res.json();
      })
      .then(data => setRoles(data.roles || data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [isLoggedIn, user]);

  if (!isLoggedIn) {
    return <Alert variant="warning">Vous devez être connecté pour accéder à cette page.</Alert>;
  }
  if (user?.role !== 'admin') {
    return <Alert variant="danger">Accès interdit : vous n'avez pas les droits nécessaires (admin requis).</Alert>;
  }

  const handleShowAdd = () => {
    setModalMode('add');
    setCurrentRole({ id: null, name: '' });
    setShowModal(true);
  };

  const handleShowEdit = (role) => {
    setModalMode('edit');
    setCurrentRole(role);
    setShowModal(true);
  };

  const fetchRoles = async () => {
    try {
      const response = await fetch(`${API_URL}/admin/roles`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Erreur lors du chargement des rôles.');
      }
      const data = await response.json();
      setRoles(data.roles || data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (modalMode === 'add') {
        const response = await fetch(`${API_URL}/admin/roles`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ name: currentRole.name })
        });
        if (!response.ok) throw new Error('Erreur lors de l\'ajout du rôle.');
      } else {
        const response = await fetch(`${API_URL}/admin/roles/${currentRole.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ name: currentRole.name })
        });
        if (!response.ok) throw new Error('Erreur lors de la modification du rôle.');
      }
      setShowModal(false);
      await fetchRoles();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce rôle ?')) return;
    setDeleteId(id);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/admin/roles/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Erreur lors de la suppression du rôle.');
      await fetchRoles();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="container">
      <h3 className="mb-4">Gestion des rôles</h3>
      <Button variant="primary" className="mb-3" onClick={handleShowAdd}>Ajouter un rôle</Button>
      {error && <Alert variant="danger">{error}</Alert>}
      {loading ? <Spinner animation="border" /> : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Nom du rôle</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((role, index) => {
              // Gérer les deux formats : ancien (string) et nouveau (object)
              const roleId = typeof role === 'string' ? role : role.id || index;
              const roleName = typeof role === 'string' ? role : role.name || role;
              
              return (
                <tr key={roleId}>
                  <td>{roleName}</td>
                  <td>
                    <Button size="sm" variant="outline-secondary" className="me-2" onClick={() => handleShowEdit(role)}>Modifier</Button>
                    <Button size="sm" variant="outline-danger" onClick={() => handleDelete(roleId)} disabled={deleteId === roleId}>
                      {deleteId === roleId ? <Spinner animation="border" size="sm" /> : 'Supprimer'}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{modalMode === 'add' ? 'Ajouter un rôle' : 'Modifier le rôle'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSave}>
          <Modal.Body>
            <Form.Group>
              <Form.Label>Nom du rôle</Form.Label>
              <InputGroup>
                <Form.Control
                  value={currentRole.name}
                  onChange={e => setCurrentRole({ ...currentRole, name: e.target.value })}
                  required
                />
              </InputGroup>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Annuler</Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? <Spinner animation="border" size="sm" /> : 'Enregistrer'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
} 