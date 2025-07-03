"use client";

import { useState, useEffect } from 'react';
import { Table, Form, Button, Alert, Spinner, Card, Badge, Modal, ListGroup, Row, Col } from 'react-bootstrap';
import { useAuth } from '../AuthContext';

const API_URL = 'http://localhost:5000/api';

function VerifierPanel() {
    const { user } = useAuth();
    const [diplomas, setDiplomas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDiploma, setSelectedDiploma] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [verificationResult, setVerificationResult] = useState(null);
    const [isVerifying, setIsVerifying] = useState(false);

    const fetchDiplomas = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_URL}/diplomas?limit=50`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
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
        fetchDiplomas();
    }, []);

    const handleVerification = async (diploma) => {
        setIsVerifying(true);
        setVerificationResult(null);
        
        try {
            // Vérification sur la blockchain
            const blockchainResponse = await fetch(`${API_URL}/blockchain/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ hash: diploma.hash })
            });

            const blockchainData = await blockchainResponse.json();
            
            // Vérification locale
            const localResponse = await fetch(`${API_URL}/diplomas/verify/${diploma.hash}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
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
        try {
            const response = await fetch(`${API_URL}/diplomas/${diplomaId}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
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

    if (loading) return <div className="text-center"><Spinner animation="border" /> <p>Chargement des diplômes...</p></div>;
    if (error) return <Alert variant="danger">{error}</Alert>;

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4>Panel de vérification des diplômes</h4>
                <Badge bg="info">Vérificateur</Badge>
            </div>

            <Card className="mb-4">
                <Card.Body>
                    <Form.Group>
                        <Form.Label>Rechercher un diplôme</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Rechercher par nom, étudiant, numéro ou institution..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </Form.Group>
                </Card.Body>
            </Card>

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
                                <div>
                                    <strong>{diploma.diploma_name}</strong>
                                    <br />
                                    <small className="text-muted">{diploma.diploma_type}</small>
                                </div>
                            </td>
                            <td>
                                {diploma.student_firstname} {diploma.student_lastname}
                                <br />
                                <small className="text-muted">#{diploma.diploma_number}</small>
                            </td>
                            <td>{diploma.issuer_institution}</td>
                            <td>
                                <Badge 
                                    bg={diploma.blockchain_registered_at ? 'success' : 'warning'}
                                >
                                    {diploma.blockchain_registered_at ? 'Enregistré' : 'En attente'}
                                </Badge>
                            </td>
                            <td>{new Date(diploma.created_at).toLocaleDateString()}</td>
                            <td>
                                <div className="d-flex gap-2">
                                    <Button 
                                        size="sm" 
                                        variant="outline-primary"
                                        onClick={() => handleShowDetails(diploma.id)}
                                    >
                                        Détails
                                    </Button>
                                    <Button 
                                        size="sm" 
                                        variant="success"
                                        onClick={() => handleVerification(diploma)}
                                        disabled={isVerifying}
                                    >
                                        {isVerifying ? (
                                            <>
                                                <Spinner animation="border" size="sm" className="me-1" />
                                                Vérification...
                                            </>
                                        ) : (
                                            'Vérifier'
                                        )}
                                    </Button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            {filteredDiplomas.length === 0 && (
                <Alert variant="info">
                    Aucun diplôme trouvé. {searchTerm && 'Essayez de modifier votre recherche.'}
                </Alert>
            )}

            {/* Modal de détails */}
            <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Détails du diplôme</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedDiploma && (
                        <div>
                            <Row>
                                <Col md={6}>
                                    <h6>Informations du diplôme</h6>
                                    <ListGroup variant="flush">
                                        <ListGroup.Item><strong>Nom:</strong> {selectedDiploma.diploma_name}</ListGroup.Item>
                                        <ListGroup.Item><strong>Type:</strong> {selectedDiploma.diploma_type}</ListGroup.Item>
                                        <ListGroup.Item><strong>Institution:</strong> {selectedDiploma.issuer_institution}</ListGroup.Item>
                                        <ListGroup.Item><strong>Date d'émission:</strong> {new Date(selectedDiploma.emission_date).toLocaleDateString()}</ListGroup.Item>
                                        <ListGroup.Item><strong>Mention:</strong> {selectedDiploma.mention}</ListGroup.Item>
                                        <ListGroup.Item><strong>Numéro:</strong> {selectedDiploma.diploma_number}</ListGroup.Item>
                                    </ListGroup>
                                </Col>
                                <Col md={6}>
                                    <h6>Informations de l'étudiant</h6>
                                    <ListGroup variant="flush">
                                        <ListGroup.Item><strong>Nom:</strong> {selectedDiploma.student_firstname} {selectedDiploma.student_lastname}</ListGroup.Item>
                                        <ListGroup.Item><strong>Date de naissance:</strong> {new Date(selectedDiploma.student_birthdate).toLocaleDateString()}</ListGroup.Item>
                                        <ListGroup.Item><strong>Téléphone:</strong> {selectedDiploma.student_phone}</ListGroup.Item>
                                    </ListGroup>
                                </Col>
                            </Row>
                            
                            <hr />
                            
                            <h6>Informations techniques</h6>
                            <ListGroup variant="flush">
                                <ListGroup.Item><strong>Hash:</strong> <code className="text-break">{selectedDiploma.hash}</code></ListGroup.Item>
                                <ListGroup.Item><strong>Statut blockchain:</strong> 
                                    <Badge bg={selectedDiploma.blockchain_registered_at ? 'success' : 'warning'} className="ms-2">
                                        {selectedDiploma.blockchain_registered_at ? 'Enregistré' : 'En attente'}
                                    </Badge>
                                </ListGroup.Item>
                                {selectedDiploma.blockchain_registered_at && (
                                    <ListGroup.Item><strong>Date d'enregistrement:</strong> {new Date(selectedDiploma.blockchain_registered_at).toLocaleString()}</ListGroup.Item>
                                )}
                                {selectedDiploma.blockchain_tx_hash && (
                                    <ListGroup.Item>
                                        <strong>Transaction:</strong> 
                                        <a 
                                            href={`https://sepolia.etherscan.io/tx/${selectedDiploma.blockchain_tx_hash}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="ms-2"
                                        >
                                            Voir sur Etherscan
                                        </a>
                                    </ListGroup.Item>
                                )}
                            </ListGroup>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
                        Fermer
                    </Button>
                    {selectedDiploma && (
                        <Button 
                            variant="success" 
                            onClick={() => {
                                handleVerification(selectedDiploma);
                                setShowDetailModal(false);
                            }}
                            disabled={isVerifying}
                        >
                            {isVerifying ? 'Vérification...' : 'Vérifier ce diplôme'}
                        </Button>
                    )}
                </Modal.Footer>
            </Modal>

            {/* Résultat de vérification */}
            {verificationResult && (
                <Modal show={!!verificationResult} onHide={() => setVerificationResult(null)} size="lg">
                    <Modal.Header closeButton>
                        <Modal.Title>Résultat de la vérification</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Alert variant={verificationResult.blockchain?.isValid ? 'success' : 'warning'}>
                            <h6>
                                {verificationResult.blockchain?.isValid ? '✅ Diplôme authentique' : '⚠️ Diplôme non trouvé sur la blockchain'}
                            </h6>
                            <p>
                                {verificationResult.blockchain?.isValid 
                                    ? 'Ce diplôme a été vérifié avec succès et est enregistré sur la blockchain.'
                                    : 'Ce diplôme n\'a pas été trouvé sur la blockchain. Il peut être en cours d\'enregistrement ou invalide.'
                                }
                            </p>
                        </Alert>

                        {verificationResult.blockchain?.isValid && verificationResult.blockchain?.diplomaInfo && (
                            <div>
                                <h6>Informations blockchain</h6>
                                <ListGroup variant="flush">
                                    <ListGroup.Item><strong>Nom:</strong> {verificationResult.blockchain.diplomaInfo.diplomaName}</ListGroup.Item>
                                    <ListGroup.Item><strong>Type:</strong> {verificationResult.blockchain.diplomaInfo.diplomaType}</ListGroup.Item>
                                    <ListGroup.Item><strong>Institution:</strong> {verificationResult.blockchain.diplomaInfo.issuerInstitution}</ListGroup.Item>
                                    <ListGroup.Item><strong>Étudiant:</strong> {verificationResult.blockchain.diplomaInfo.studentName}</ListGroup.Item>
                                    <ListGroup.Item><strong>Enregistré le:</strong> {new Date(verificationResult.blockchain.diplomaInfo.timestamp).toLocaleString()}</ListGroup.Item>
                                    <ListGroup.Item><strong>Émetteur:</strong> <code>{verificationResult.blockchain.diplomaInfo.issuerAddress}</code></ListGroup.Item>
                                </ListGroup>
                            </div>
                        )}

                        <div className="mt-3">
                            <small className="text-muted">
                                Vérifié le: {verificationResult.verifiedAt.toLocaleString()}
                            </small>
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setVerificationResult(null)}>
                            Fermer
                        </Button>
                    </Modal.Footer>
                </Modal>
            )}
        </div>
    );
}

export default VerifierPanel; 