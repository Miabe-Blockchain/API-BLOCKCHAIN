"use client";
import { useState, useEffect } from 'react';
import { Table, Form, Button, Alert, Spinner, Card, Badge, Modal } from 'react-bootstrap';
import { FaCheckCircle, FaQrcode } from 'react-icons/fa';
import DiplomaDetailModal from '../../components/DiplomaDetailModal';
import QRScanner from '../../components/QRScanner';

const API_URL = 'http://localhost:5000/api';

function VerificationCheckPanel() {
  const [diplomas, setDiplomas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDiploma, setSelectedDiploma] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [token, setToken] = useState(null);

  // Gestion du token côté client uniquement
  useEffect(() => {
    setToken(localStorage.getItem('token'));
  }, []);

  const fetchDiplomas = async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/diplomas?limit=50`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Erreur lors du chargement des diplômes.');
      const data = await response.json();
      setDiplomas(data.diplomas || data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDiplomas();
    }
  }, [token]);

  const handleVerification = async (diploma) => {
    if (!token) return;
    
    setIsVerifying(true);
    setVerificationResult(null);
    try {
      // Vérification sur la blockchain
      const blockchainResponse = await fetch(`${API_URL}/blockchain/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ hash: diploma.hash })
      });
      const blockchainData = await blockchainResponse.json();
      // Vérification locale
      const localResponse = await fetch(`${API_URL}/diplomas/verify/${diploma.hash}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const localData = await localResponse.json();
      setVerificationResult({
        diploma: diploma,
        blockchain: blockchainData,
        local: localData,
        verifiedAt: new Date()
      });
    } catch (err) {
      setError('Erreur lors de la vérification: ' + err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleShowDetails = async (diplomaId) => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_URL}/diplomas/${diplomaId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Erreur lors du chargement des détails.');
      const data = await response.json();
      setSelectedDiploma(data.diploma || data);
      setShowDetailModal(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredDiplomas = diplomas.filter(diploma =>
    diploma.diploma_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    diploma.student_firstname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    diploma.student_lastname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    diploma.diploma_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    diploma.issuer_institution?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Gestion du scan QR avec le nouveau composant
  const handleScan = (data) => {
    if (data && typeof data === 'string') {
      setSearchTerm(data);
      setShowQrScanner(false);
      // Optionnel : lancer la vérification automatique si le hash correspond à un diplôme
      const found = diplomas.find(d => d.hash === data);
      if (found) {
        handleVerification(found);
      }
    }
  };
  
  const handleQRError = (err) => {
    console.error('Erreur lecteur QR:', err);
    setError('Erreur lecteur QR : ' + (err.message || 'Impossible d\'accéder à la webcam'));
    setShowQrScanner(false);
  };

  const handleQRClose = () => {
    setShowQrScanner(false);
  };

  // Si pas de token, afficher un message
  if (!token) {
    return (
      <div className="text-center p-4">
        <Alert variant="warning">
          Veuillez vous connecter pour accéder à cette page.
        </Alert>
      </div>
    );
  }

  return (
    <div>
      <h3 className="mb-4">Vérifier un diplôme</h3>
      <Card className="mb-4">
        <Card.Body>
          <Form.Group>
            <Form.Label>Rechercher un diplôme</Form.Label>
            <div className="d-flex gap-2">
              <Form.Control
                type="text"
                placeholder="Rechercher par nom, étudiant, numéro, institution ou hash..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button variant="outline-secondary" onClick={() => setShowQrScanner(true)} title="Scanner un QR code">
                <FaQrcode />
              </Button>
            </div>
          </Form.Group>
        </Card.Body>
      </Card>
      {showQrScanner && (
        <Modal show={showQrScanner} onHide={handleQRClose} centered size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Scanner un QR code</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <QRScanner
              onScan={handleScan}
              onError={handleQRError}
              onClose={handleQRClose}
            />
          </Modal.Body>
        </Modal>
      )}
      {error && <Alert variant="danger">{error}</Alert>}
      {loading ? (
        <div className="text-center"><Spinner animation="border" /> <p>Chargement des diplômes...</p></div>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Diplôme</th>
              <th>Étudiant</th>
              <th>Institution</th>
              <th>Statut Blockchain</th>
              <th>Date de création</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDiplomas.map(diploma => (
              <tr key={diploma.id}>
                <td>
                  <strong>{diploma.diploma_name}</strong>
                  <br />
                  <small className="text-muted">{diploma.diploma_type}</small>
                </td>
                <td>{diploma.student_firstname} {diploma.student_lastname}<br /><small className="text-muted">#{diploma.diploma_number}</small></td>
                <td>{diploma.issuer_institution}</td>
                <td>
                  <Badge bg={diploma.blockchain_registered_at ? 'success' : 'warning'}>
                    {diploma.blockchain_registered_at ? 'Enregistré' : 'En attente'}
                  </Badge>
                </td>
                <td>{new Date(diploma.created_at).toLocaleDateString()}</td>
                <td>
                  <div className="d-flex gap-2">
                    <Button size="sm" variant="outline-primary" onClick={() => handleShowDetails(diploma.id)}>
                      Détails
                    </Button>
                    <Button size="sm" variant="success" onClick={() => handleVerification(diploma)} disabled={isVerifying}>
                      {isVerifying ? <Spinner animation="border" size="sm" className="me-1" /> : <FaCheckCircle className="me-1" />}
                      Vérifier sur la blockchain
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      {filteredDiplomas.length === 0 && !loading && (
        <Alert variant="info">Aucun diplôme trouvé. {searchTerm && 'Essayez de modifier votre recherche.'}</Alert>
      )}
      {/* Modal de détails */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Détails du diplôme</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <DiplomaDetailModal
            show={showDetailModal}
            onHide={() => setShowDetailModal(false)}
            diploma={selectedDiploma}
            error={null}
            isLoading={false}
          />
        </Modal.Body>
      </Modal>
      {/* Résultat de vérification */}
      {verificationResult && (
        <Alert variant={verificationResult.blockchain.verified ? 'success' : 'danger'} className="mt-4">
          <h5>Résultat de la vérification</h5>
          <div>
            <strong>Blockchain :</strong> {verificationResult.blockchain.verified ? 'Diplôme valide' : 'Non trouvé sur la blockchain'}<br />
            <strong>Vérification locale :</strong> {verificationResult.local.verified ? 'Diplôme valide' : 'Non trouvé localement'}
          </div>
          <div className="mt-2 text-muted" style={{ fontSize: 13 }}>
            Vérifié le : {verificationResult.verifiedAt.toLocaleString()}
          </div>
        </Alert>
      )}
    </div>
  );
}

export default VerificationCheckPanel; 