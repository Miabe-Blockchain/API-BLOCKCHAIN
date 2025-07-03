'use client';

import { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Badge, ListGroup, Image, Modal } from 'react-bootstrap';
import { FaQrcode, FaSearch, FaCheckCircle, FaTimesCircle, FaExternalLinkAlt } from 'react-icons/fa';
import Header from '../components/Header';
import QRScanner from '../components/QRScanner';
import { useAuth } from '../AuthContext';

const API_URL = 'http://localhost:5000/api';

export default function PublicVerificationPage() {
    const [hash, setHash] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);
    const [showQR, setShowQR] = useState(false);
    const { isLoggedIn, user } = useAuth();

    const handleVerify = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setResult(null);
        try {
            const response = await fetch(`${API_URL}/diplomas/verify/${hash}`);
            const data = await response.json();
            if (!response.ok || !data.verified) {
                setError("Diplôme non trouvé ou invalide.");
            } else {
                setResult(data);
            }
        } catch (err) {
            setError("Erreur lors de la vérification.");
        } finally {
            setLoading(false);
        }
    };

    const handleScanQR = () => {
        setShowQR(true);
    };

    const handleScan = (data) => {
        if (data) {
            setHash(data);
            setShowQR(false);
        }
    };

    const handleQRError = (err) => {
        setError('Erreur lors du scan QR: ' + err.message);
        setShowQR(false);
    };

    const handleQRClose = () => {
        setShowQR(false);
    };

    return (
        <div>
            <Header 
                isLoggedIn={isLoggedIn} 
                onLogin={() => window.location.href = '/'} 
                onLogout={() => window.location.href = '/'}
                user={user}
            />
            <Container className="py-5">
                <Row className="justify-content-center">
                    <Col md={8} lg={6}>
                        {/* En-tête */}
                        <div className="text-center mb-5">
                            <h1 className="display-4 mb-3">🔍 Vérification de Diplôme</h1>
                            <p className="lead text-muted">
                                Vérifiez l'authenticité d'un diplôme en scannant son QR code ou en saisissant son hash
                            </p>
                        </div>

                        {/* Formulaire de vérification */}
                        <Card className="mb-4">
                            <Card.Header>
                                <h5>Vérifier un diplôme</h5>
                            </Card.Header>
                            <Card.Body>
                                <Form onSubmit={handleVerify}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Code ou hash du diplôme</Form.Label>
                                        <Form.Control
                                            type="text"
                                            placeholder="Collez ou scannez le code..."
                                            value={hash}
                                            onChange={(e) => setHash(e.target.value)}
                                            required
                                        />
                                    </Form.Group>

                                    <div className="d-flex gap-2">
                                        <Button 
                                            type="submit" 
                                            variant="primary" 
                                            disabled={loading}
                                            className="flex-fill"
                                        >
                                            {loading ? (
                                                <Spinner animation="border" size="sm" />
                                            ) : (
                                                <FaSearch className="me-1" />
                                            )} Vérifier
                                        </Button>
                                        
                                        <Button 
                                            variant="outline-secondary"
                                            onClick={handleScanQR}
                                            disabled={loading}
                                        >
                                            <FaQrcode className="me-1" /> Scanner QR
                                        </Button>
                                    </div>
                                </Form>
                            </Card.Body>
                        </Card>

                        {/* Messages d'erreur */}
                        {error && (
                            <Alert variant="danger" onClose={() => setError(null)} dismissible>
                                {error}
                            </Alert>
                        )}

                        {/* Résultat de vérification */}
                        {result && (
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

                        {/* Informations supplémentaires */}
                        <Card className="mt-4">
                            <Card.Body>
                                <h6>Comment utiliser cette vérification ?</h6>
                                <ul className="mb-0">
                                    <li><strong>QR Code :</strong> Scannez le QR code imprimé sur le diplôme</li>
                                    <li><strong>Hash manuel :</strong> Saisissez le hash affiché sur le diplôme</li>
                                    <li><strong>Résultat :</strong> Vérifiez l'authenticité et les informations du diplôme</li>
                                </ul>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
                <Modal show={showQR} onHide={handleQRClose} size="lg">
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
            </Container>
        </div>
    );
} 