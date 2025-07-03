"use client";

import { useState, useEffect } from 'react';
import { Card, Button, Form, Alert, Spinner, Row, Col, InputGroup } from 'react-bootstrap';
import { useAuth } from '../AuthContext';

const API_URL = 'http://localhost:5000/api';

export default function Settings({ user, isAdmin }) {
  const { user: authUser } = useAuth();
  // États pour le profil
  const [profile, setProfile] = useState(null);
  const [profileEdit, setProfileEdit] = useState({});
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [profileSuccess, setProfileSuccess] = useState(null);

  // États pour le wallet
  const [walletAddress, setWalletAddress] = useState('');
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState(null);
  const [walletSuccess, setWalletSuccess] = useState(null);

  // États pour le mot de passe
  const [passwords, setPasswords] = useState({ oldPassword: '', newPassword: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(null);

  // États pour le statut utilisateur (admin)
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState(null);
  const [statusSuccess, setStatusSuccess] = useState(null);

  // Charger le profil utilisateur
  useEffect(() => {
    setProfileLoading(true);
    fetch(`${API_URL}/users/profile`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => {
        setProfile(data);
        setProfileEdit(data);
      })
      .catch(() => setProfileError("Erreur lors du chargement du profil."))
      .finally(() => setProfileLoading(false));
  }, []);

  // Modifier le profil
  const handleProfileChange = (e) => {
    setProfileEdit({ ...profileEdit, [e.target.name]: e.target.value });
  };
  const handleProfileSave = (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileError(null);
    setProfileSuccess(null);
    fetch(`${API_URL}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(profileEdit)
    })
      .then(res => res.json().then(data => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data.message || 'Erreur lors de la mise à jour');
        setProfile(data);
        setProfileSuccess('Profil mis à jour !');
      })
      .catch(err => setProfileError(err.message))
      .finally(() => setProfileLoading(false));
  };

  // Connexion portefeuille Web3
  const handleConnectWallet = async () => {
    setWalletLoading(true);
    setWalletError(null);
    setWalletSuccess(null);
    fetch(`${API_URL}/users/connect-wallet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ wallet_address: walletAddress })
    })
      .then(res => res.json().then(data => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data.message || 'Erreur connexion wallet');
        setWalletSuccess('Portefeuille connecté !');
      })
      .catch(err => setWalletError(err.message))
      .finally(() => setWalletLoading(false));
  };
  const handleDisconnectWallet = async () => {
    setWalletLoading(true);
    setWalletError(null);
    setWalletSuccess(null);
    fetch(`${API_URL}/users/disconnect-wallet`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json().then(data => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data.message || 'Erreur déconnexion wallet');
        setWalletSuccess('Portefeuille déconnecté !');
      })
      .catch(err => setWalletError(err.message))
      .finally(() => setWalletLoading(false));
  };

  // Changement de mot de passe
  const handlePasswordChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError(null);
    setPasswordSuccess(null);
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
        setPasswordSuccess('Mot de passe changé !');
        setPasswords({ oldPassword: '', newPassword: '' });
      })
      .catch(err => setPasswordError(err.message))
      .finally(() => setPasswordLoading(false));
  };

  // Gestion du statut utilisateur (admin)
  useEffect(() => {
    if (!isAdmin) return;
    setUsersLoading(true);
    fetch(`${API_URL}/users`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => setUsers(Array.isArray(data) ? data : data.users || []))
      .catch(() => setUsersError("Erreur chargement utilisateurs"))
      .finally(() => setUsersLoading(false));
  }, [isAdmin, statusSuccess]);

  const handleStatusChange = (userId, newStatus) => {
    setUsersLoading(true);
    setStatusSuccess(null);
    fetch(`${API_URL}/users/${userId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ status: newStatus })
    })
      .then(res => res.json().then(data => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data.message || 'Erreur changement statut');
        setStatusSuccess('Statut modifié !');
      })
      .catch(() => setUsersError("Erreur changement statut"))
      .finally(() => setUsersLoading(false));
  };

  // Utiliser le rôle de l'utilisateur connecté ou celui passé en props
  const currentUserRole = user?.role || authUser?.role;
  const currentIsAdmin = isAdmin || currentUserRole === 'admin';

  return (
    <div>
      <h3>Paramètres du compte</h3>
      {/* Profil utilisateur */}
      <Card className="mb-4">
        <Card.Header>Profil</Card.Header>
        <Card.Body>
          {profileLoading ? <Spinner animation="border" /> : (
            <Form onSubmit={handleProfileSave}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Prénom</Form.Label>
                    <Form.Control name="first_name" value={profileEdit?.first_name || ''} onChange={handleProfileChange} />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Nom</Form.Label>
                    <Form.Control name="last_name" value={profileEdit?.last_name || ''} onChange={handleProfileChange} />
                  </Form.Group>
                </Col>
              </Row>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control name="email" value={profileEdit?.email || ''} onChange={handleProfileChange} type="email" />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Téléphone</Form.Label>
                <Form.Control name="phone" value={profileEdit?.phone || ''} onChange={handleProfileChange} />
              </Form.Group>
              <Button type="submit" disabled={profileLoading}>Enregistrer</Button>
              {profileError && <Alert variant="danger" className="mt-2">{profileError}</Alert>}
              {profileSuccess && <Alert variant="success" className="mt-2">{profileSuccess}</Alert>}
            </Form>
          )}
        </Card.Body>
      </Card>

      {/* Wallet Web3 */}
      <Card className="mb-4">
        <Card.Header>Portefeuille Web3</Card.Header>
        <Card.Body>
          <InputGroup className="mb-3">
            <Form.Control placeholder="Adresse du portefeuille" value={walletAddress} onChange={e => setWalletAddress(e.target.value)} />
            <Button variant="success" onClick={handleConnectWallet} disabled={walletLoading}>Connecter</Button>
            <Button variant="danger" onClick={handleDisconnectWallet} disabled={walletLoading}>Déconnecter</Button>
          </InputGroup>
          {walletError && <Alert variant="danger">{walletError}</Alert>}
          {walletSuccess && <Alert variant="success">{walletSuccess}</Alert>}
        </Card.Body>
      </Card>

      {/* Changement de mot de passe */}
      <Card className="mb-4">
        <Card.Header>Changer le mot de passe</Card.Header>
        <Card.Body>
          <Form onSubmit={handlePasswordSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Ancien mot de passe</Form.Label>
              <Form.Control type="password" name="oldPassword" value={passwords.oldPassword} onChange={handlePasswordChange} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Nouveau mot de passe</Form.Label>
              <Form.Control type="password" name="newPassword" value={passwords.newPassword} onChange={handlePasswordChange} required />
            </Form.Group>
            <Button type="submit" disabled={passwordLoading}>Changer</Button>
            {passwordError && <Alert variant="danger" className="mt-2">{passwordError}</Alert>}
            {passwordSuccess && <Alert variant="success" className="mt-2">{passwordSuccess}</Alert>}
          </Form>
        </Card.Body>
      </Card>

      {/* Gestion du statut utilisateur (admin) */}
      {currentIsAdmin && (
        <Card className="mb-4">
          <Card.Header>Gestion des statuts utilisateurs</Card.Header>
          <Card.Body>
            {usersLoading ? <Spinner animation="border" /> : usersError ? <Alert variant="danger">{usersError}</Alert> : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Email</th>
                    <th>Statut</th>
                    <th>Changer le statut</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>{u.first_name} {u.last_name}</td>
                      <td>{u.email}</td>
                      <td>{u.status}</td>
                      <td>
                        <Form.Select size="sm" value={u.status} onChange={e => handleStatusChange(u.id, e.target.value)}>
                          <option value="active">Actif</option>
                          <option value="inactive">Inactif</option>
                          <option value="suspended">Suspendu</option>
                        </Form.Select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {statusSuccess && <Alert variant="success">{statusSuccess}</Alert>}
          </Card.Body>
        </Card>
      )}
    </div>
  );
} 