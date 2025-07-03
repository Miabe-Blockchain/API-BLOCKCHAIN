"use client";
import { useState } from 'react';
import { Card, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../../AuthContext';

const API_URL = 'http://localhost:5000/api';

function SecuritySettingsPanel() {
  const { isLoggedIn } = useAuth();
  const [passwords, setPasswords] = useState({ oldPassword: '', newPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  if (!isLoggedIn) {
    return <Alert variant="warning">Vous devez être connecté pour accéder à cette page.</Alert>;
  }

  const handleChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    fetch(`${API_URL}/users/change-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(passwords)
    })
      .then(res => res.json().then(data => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data.message || 'Erreur changement mot de passe');
        setSuccess('Mot de passe changé !');
        setPasswords({ oldPassword: '', newPassword: '' });
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  return (
    <div className="container">
      <h3 className="mb-4">Sécurité</h3>
      <Card>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Ancien mot de passe</Form.Label>
              <Form.Control type="password" name="oldPassword" value={passwords.oldPassword} onChange={handleChange} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Nouveau mot de passe</Form.Label>
              <Form.Control type="password" name="newPassword" value={passwords.newPassword} onChange={handleChange} required />
            </Form.Group>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? <Spinner animation="border" size="sm" /> : 'Changer le mot de passe'}
            </Button>
            {success && <Alert variant="success" className="mt-3">{success}</Alert>}
            {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
}

export default SecuritySettingsPanel; 