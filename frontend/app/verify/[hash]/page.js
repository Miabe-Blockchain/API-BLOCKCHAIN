"use client";
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, Alert, Spinner, Badge, ListGroup } from 'react-bootstrap';
import { FaCheckCircle, FaTimesCircle, FaExternalLinkAlt } from 'react-icons/fa';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../AuthContext';

const API_URL = 'http://localhost:5000/api';

export default function VerifyHashResult() {
  const params = useParams();
  const hash = params.hash;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const { isLoggedIn, user } = useAuth ? useAuth() : { isLoggedIn: false, user: null };

  useEffect(() => {
    if (!hash) return;
    setLoading(true);
    setError(null);
    setResult(null);
    fetch(`${API_URL}/diplomas/verify/${hash}`)
      .then(res => res.json().then(data => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok || !data.verified) {
          setError("Diplôme non trouvé ou invalide.");
        } else {
          setResult(data);
        }
      })
      .catch(() => setError("Erreur lors de la vérification."))
      .finally(() => setLoading(false));
  }, [hash]);

  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      {/* Sidebar visible uniquement si connecté */}
      {isLoggedIn && (
        <Sidebar
          activeTab={''}
          isAdmin={user?.role === 'admin'}
          isVerifier={user?.role === 'verificateur'}
          user={user}
          onLogout={() => {}}
        />
      )}
      <main style={{ flex: 1, marginLeft: isLoggedIn ? 220 : 0, padding: 24 }}>
        <div className="container" style={{ maxWidth: 500 }}>
          <h3 className="mb-4">Vérification d'un diplôme</h3>
          {loading ? <Spinner animation="border" /> : error ? (
            <Alert variant="danger">{error}</Alert>
          ) : (
            <Card className="mb-4 shadow">
              <Card.Header className="d-flex align-items-center gap-2">
                {result.verified ? (
                  <Badge bg="success" className="d-flex align-items-center gap-1"><FaCheckCircle /> Diplôme authentique</Badge>
                ) : (
                  <Badge bg="danger" className="d-flex align-items-center gap-1"><FaTimesCircle /> Diplôme invalide</Badge>
                )}
                <span className="ms-auto text-muted" style={{ fontSize: 13 }}>Vérifié le : {new Date().toLocaleString('fr-FR')}</span>
              </Card.Header>
              <Card.Body>
                <h5 className="mb-3">Informations du diplôme</h5>
                <ListGroup variant="flush" className="mb-3">
                  <ListGroup.Item><strong>Nom du diplôme :</strong> {result.diploma_name}</ListGroup.Item>
                  <ListGroup.Item><strong>Type :</strong> {result.diploma_type}</ListGroup.Item>
                  <ListGroup.Item><strong>Institution :</strong> {result.issuer_institution}</ListGroup.Item>
                  <ListGroup.Item><strong>Date d'émission :</strong> {new Date(result.emission_date).toLocaleDateString('fr-FR')}</ListGroup.Item>
                  <ListGroup.Item><strong>Mention :</strong> {result.mention || 'Non spécifiée'}</ListGroup.Item>
                  <ListGroup.Item><strong>Numéro :</strong> {result.diploma_number}</ListGroup.Item>
                  <ListGroup.Item><strong>Étudiant :</strong> {result.student_firstname} {result.student_lastname}</ListGroup.Item>
                  <ListGroup.Item><strong>Date de naissance :</strong> {result.student_birthdate ? new Date(result.student_birthdate).toLocaleDateString('fr-FR') : 'Non renseignée'}</ListGroup.Item>
                  <ListGroup.Item><strong>Téléphone :</strong> {result.student_phone || 'Non renseigné'}</ListGroup.Item>
                </ListGroup>
                {result.blockchain_registered_at && (
                  <div className="mt-3">
                    <h6>Informations blockchain</h6>
                    <ListGroup variant="flush">
                      <ListGroup.Item>
                        <strong>Statut :</strong>
                        <Badge bg="success" className="ms-2">Enregistré sur la blockchain</Badge>
                      </ListGroup.Item>
                      <ListGroup.Item>
                        <strong>Date d'enregistrement :</strong> {new Date(result.blockchain_registered_at).toLocaleString('fr-FR')}
                      </ListGroup.Item>
                      {result.blockchain_transaction_hash && (
                        <ListGroup.Item>
                          <strong>Transaction :</strong>
                          <a
                            href={`https://sepolia.etherscan.io/tx/${result.blockchain_transaction_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ms-2"
                          >
                            Voir sur Etherscan <FaExternalLinkAlt style={{ fontSize: 13 }} />
                          </a>
                        </ListGroup.Item>
                      )}
                    </ListGroup>
                  </div>
                )}
              </Card.Body>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
} 