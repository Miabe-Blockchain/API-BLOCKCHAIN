"use client";
import { useState, useEffect } from 'react';
import { Card, Button, Form, Alert, Spinner, Row, Col, InputGroup, Badge } from 'react-bootstrap';
import { useAuth } from '../../AuthContext';
import { FaWallet, FaUnlink, FaLink, FaUniversity, FaPhone, FaUserTag } from 'react-icons/fa';

const API_URL = 'http://localhost:5000/api';

function ProfileSettingsPanel() {
  const { isLoggedIn } = useAuth();
  const [profile, setProfile] = useState(null);
  const [profileEdit, setProfileEdit] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [walletAddress, setWalletAddress] = useState('');
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState(null);
  const [walletSuccess, setWalletSuccess] = useState(null);
  const [isMetaMaskAvailable, setIsMetaMaskAvailable] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      setError("Vous devez être connecté pour accéder à cette page.");
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`${API_URL}/users/profile`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => {
        setProfile(data);
        setProfileEdit(data);
        setWalletAddress(data.wallet_address || '');
      })
      .catch(() => setError("Erreur lors du chargement du profil."))
      .finally(() => setLoading(false));
  }, [isLoggedIn]);

  // Détecter si MetaMask est disponible
  useEffect(() => {
    setIsMetaMaskAvailable(typeof window.ethereum !== 'undefined');
  }, []);

  const handleChange = (e) => {
    setProfileEdit({ ...profileEdit, [e.target.name]: e.target.value });
  };

  const handleSave = (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
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
        setSuccess('Profil mis à jour !');
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  // Gestion du wallet
  const handleConnectWallet = async () => {
    setWalletLoading(true);
    setWalletError(null);
    setWalletSuccess(null);
    
    try {
      // Vérifier si MetaMask est installé
      if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask n\'est pas installé. Veuillez installer l\'extension MetaMask pour continuer.');
      }

      // Demander la connexion au wallet
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('Aucun compte MetaMask sélectionné.');
      }

      const address = accounts[0];

      // Vérifier que l'adresse est valide
      if (!address || address.length !== 42 || !address.startsWith('0x')) {
        throw new Error('Adresse wallet invalide.');
      }

      // Envoyer l'adresse au serveur
      const response = await fetch(`${API_URL}/users/connect-wallet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ wallet_address: address })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la connexion du wallet.');
      }

      setWalletAddress(address);
      setWalletSuccess('Wallet MetaMask connecté avec succès !');
      
      // Mettre à jour le profil local
      if (profile) {
        setProfile({ ...profile, wallet_address: address });
      }

    } catch (err) {
      console.error('Erreur de connexion MetaMask:', err);
      setWalletError(err?.message || JSON.stringify(err) || 'Erreur inconnue lors de la connexion MetaMask.');
    } finally {
      setWalletLoading(false);
    }
  };

  const handleDisconnectWallet = async () => {
    setWalletLoading(true);
    setWalletError(null);
    setWalletSuccess(null);
    try {
      const response = await fetch(`${API_URL}/users/disconnect-wallet`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Erreur lors de la déconnexion du wallet.');
      setWalletAddress('');
      setWalletSuccess('Wallet déconnecté !');
      
      // Mettre à jour le profil local
      if (profile) {
        setProfile({ ...profile, wallet_address: null });
      }
    } catch (err) {
      setWalletError(err.message);
    } finally {
      setWalletLoading(false);
    }
  };

  // Fonction pour obtenir la couleur du badge selon le rôle
  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case 'admin': return 'danger';
      case 'emetteur': return 'primary';
      case 'verificateur': return 'success';
      case 'pending': return 'warning';
      default: return 'secondary';
    }
  };

  // Fonction pour obtenir la couleur du badge selon le statut
  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'secondary';
      case 'suspended': return 'danger';
      default: return 'warning';
    }
  };

  // Fonction pour traduire les rôles
  const translateRole = (role) => {
    switch (role) {
      case 'admin': return 'Administrateur';
      case 'emetteur': return 'Émetteur';
      case 'verificateur': return 'Vérificateur';
      case 'pending': return 'En attente';
      default: return role;
    }
  };

  // Fonction pour traduire les statuts
  const translateStatus = (status) => {
    switch (status) {
      case 'active': return 'Actif';
      case 'inactive': return 'Inactif';
      case 'suspended': return 'Suspendu';
      default: return status;
    }
  };

  // Fonction pour formater l'adresse wallet (afficher seulement les premiers et derniers caractères)
  const formatWalletAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!isLoggedIn) {
    return <Alert variant="warning">Vous devez être connecté pour accéder à cette page.</Alert>;
  }

  return (
    <div className="container">
      <h3 className="mb-4">Profil utilisateur</h3>
      
      {/* Informations de base */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Informations personnelles</h5>
        </Card.Header>
        <Card.Body>
          {loading ? <Spinner animation="border" /> : (
            <Form onSubmit={handleSave}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Prénom *</Form.Label>
                    <Form.Control 
                      name="first_name" 
                      value={profileEdit?.first_name || ''} 
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Nom *</Form.Label>
                    <Form.Control 
                      name="last_name" 
                      value={profileEdit?.last_name || ''} 
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
              
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email *</Form.Label>
                    <Form.Control 
                      name="email" 
                      value={profileEdit?.email || ''} 
                      onChange={handleChange} 
                      type="email"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Institution</Form.Label>
                    <InputGroup>
                      <InputGroup.Text><FaUniversity /></InputGroup.Text>
                      <Form.Control 
                        name="institution_name" 
                        value={profileEdit?.institution_name || ''} 
                        onChange={handleChange}
                        placeholder="Nom de votre institution"
                      />
                    </InputGroup>
                    <Form.Text className="text-muted">
                      Requis pour les émetteurs de diplômes
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Téléphone</Form.Label>
                    <InputGroup>
                      <InputGroup.Text><FaPhone /></InputGroup.Text>
                      <Form.Control 
                        name="phone" 
                        value={profileEdit?.phone || ''} 
                        onChange={handleChange}
                        placeholder="+1 234 567 8900"
                      />
                    </InputGroup>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Date de naissance</Form.Label>
                    <Form.Control
                      type="date"
                      name="birthdate"
                      value={profileEdit?.birthdate || ''}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
              {success && <Alert variant="success" className="mt-3">{success}</Alert>}
              {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
            </Form>
          )}
        </Card.Body>
      </Card>

      {/* Informations système (lecture seule) */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Informations système</h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <div className="mb-3">
                <label className="form-label">
                  <FaUserTag className="me-2" />
                  Rôle
                </label>
                <div>
                  <Badge bg={getRoleBadgeVariant(profile?.role)} className="fs-6">
                    {translateRole(profile?.role)}
                  </Badge>
                </div>
              </div>
            </Col>
            <Col md={6}>
              <div className="mb-3">
                <label className="form-label">Statut du compte</label>
                <div>
                  <Badge bg={getStatusBadgeVariant(profile?.status)} className="fs-6">
                    {translateStatus(profile?.status)}
                  </Badge>
                </div>
                <small className="text-muted">
                  Seul l'administrateur peut modifier le statut
                </small>
              </div>
            </Col>
          </Row>
          {profile?.last_login && (
            <div className="mb-3">
              <label className="form-label">Dernière connexion</label>
              <div className="text-muted">
                {new Date(profile.last_login).toLocaleString('fr-FR')}
              </div>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Wallet */}
      <Card>
        <Card.Header className="d-flex align-items-center gap-2">
          <FaWallet /> Wallet MetaMask
        </Card.Header>
        <Card.Body>
          {!isMetaMaskAvailable && (
            <Alert variant="warning" className="mb-3">
              <strong>MetaMask non détecté</strong><br />
              Pour connecter votre wallet, vous devez installer l'extension MetaMask dans votre navigateur.
              <br />
              <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer" className="alert-link">
                Télécharger MetaMask
              </a>
            </Alert>
          )}

          {walletAddress ? (
            <div className="mb-3">
              <div className="d-flex align-items-center gap-2 mb-2">
                <Badge bg="success">Connecté</Badge>
                <small className="text-muted">Adresse complète : {walletAddress}</small>
              </div>
              <InputGroup>
                <Form.Control 
                  value={formatWalletAddress(walletAddress)} 
                  readOnly 
                  className="font-monospace"
                />
                <Button variant="outline-danger" onClick={handleDisconnectWallet} disabled={walletLoading}>
                  <FaUnlink className="me-1" /> Déconnecter
                </Button>
              </InputGroup>
            </div>
          ) : (
            <div className="mb-3">
              <Button 
                variant="outline-primary" 
                onClick={handleConnectWallet} 
                disabled={walletLoading || !isMetaMaskAvailable}
                className="mb-2"
              >
                <FaLink className="me-1" /> 
                {walletLoading ? 'Connexion en cours...' : 'Connecter MetaMask'}
              </Button>
              {!isMetaMaskAvailable && (
                <div className="text-muted small">
                  <FaWallet className="me-1" />
                  Installez MetaMask pour connecter votre wallet
                </div>
              )}
            </div>
          )}
          
          {walletLoading && <Spinner animation="border" size="sm" className="ms-2" />}
          {walletSuccess && <Alert variant="success" className="mt-3">{walletSuccess}</Alert>}
          {walletError && <Alert variant="danger" className="mt-3">{walletError}</Alert>}
        </Card.Body>
      </Card>
    </div>
  );
}

export default ProfileSettingsPanel; 