"use client";

import { useState } from 'react';
import { Form, Button, Card, Alert, Spinner, Badge, ListGroup } from 'react-bootstrap';

const API_URL = 'http://localhost:5000/api';

function DiplomaVerification({ token }) {
    const [hash, setHash] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationResult, setVerificationResult] = useState(null);
    const [error, setError] = useState(null);

    const handleVerification = async (e) => {
        e.preventDefault();
        if (!hash.trim()) return;

        setIsVerifying(true);
        setError(null);
        setVerificationResult(null);

        try {
            const response = await fetch(`${API_URL}/blockchain/verify/${hash.trim()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de la vérification');
            }

            setVerificationResult(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsVerifying(false);
        }
    };

    return (
        <div>
            <Card className="mb-4">
                <Card.Header>
                    <h5>Vérification de diplôme</h5>
                </Card.Header>
                <Card.Body>
                    <p className="text-muted">
                        Entrez le hash du diplôme pour vérifier son authenticité sur la blockchain.
                    </p>
                    
                    <Form onSubmit={handleVerification}>
                        <Form.Group className="mb-3">
                            <Form.Label>Hash du diplôme</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Entrez le hash du diplôme..."
                                value={hash}
                                onChange={(e) => setHash(e.target.value)}
                                required
                            />
                            <Form.Text className="text-muted">
                                Le hash est un identifiant unique du diplôme généré lors de sa création.
                            </Form.Text>
                        </Form.Group>
                        
                        <Button 
                            type="submit" 
                            variant="primary" 
                            disabled={isVerifying || !hash.trim()}
                        >
                            {isVerifying ? (
                                <>
                                    <Spinner animation="border" size="sm" className="me-2" />
                                    Vérification...
                                </>
                            ) : (
                                'Vérifier le diplôme'
                            )}
                        </Button>
                    </Form>
                </Card.Body>
            </Card>

            {error && (
                <Alert variant="danger" onClose={() => setError(null)} dismissible>
                    {error}
                </Alert>
            )}

            {verificationResult && (
                <Card>
                    <Card.Header>
                        <div className="d-flex justify-content-between align-items-center">
                            <h6>Résultat de la vérification</h6>
                            <Badge bg={verificationResult.isValid ? 'success' : 'danger'}>
                                {verificationResult.isValid ? 'Diplôme Valide' : 'Diplôme Invalide'}
                            </Badge>
                        </div>
                    </Card.Header>
                    <Card.Body>
                        {verificationResult.isValid ? (
                            <div>
                                <Alert variant="success">
                                    ✅ Ce diplôme est authentique et a été enregistré sur la blockchain.
                                </Alert>
                                
                                {verificationResult.diplomaInfo && (
                                    <div>
                                        <h6>Informations du diplôme</h6>
                                        <ListGroup variant="flush">
                                            <ListGroup.Item>
                                                <strong>Nom du diplôme:</strong> {verificationResult.diplomaInfo.diplomaName}
                                            </ListGroup.Item>
                                            <ListGroup.Item>
                                                <strong>Type:</strong> {verificationResult.diplomaInfo.diplomaType}
                                            </ListGroup.Item>
                                            <ListGroup.Item>
                                                <strong>Institution:</strong> {verificationResult.diplomaInfo.issuerInstitution}
                                            </ListGroup.Item>
                                            <ListGroup.Item>
                                                <strong>Date d'émission:</strong> {new Date(verificationResult.diplomaInfo.emissionDate).toLocaleDateString()}
                                            </ListGroup.Item>
                                            <ListGroup.Item>
                                                <strong>Mention:</strong> {verificationResult.diplomaInfo.mention || 'Non spécifiée'}
                                            </ListGroup.Item>
                                            <ListGroup.Item>
                                                <strong>Numéro:</strong> {verificationResult.diplomaInfo.diplomaNumber}
                                            </ListGroup.Item>
                                            <ListGroup.Item>
                                                <strong>Étudiant:</strong> {verificationResult.diplomaInfo.studentName}
                                            </ListGroup.Item>
                                            <ListGroup.Item>
                                                <strong>Date de naissance:</strong> {new Date(verificationResult.diplomaInfo.studentBirthdate).toLocaleDateString()}
                                            </ListGroup.Item>
                                            <ListGroup.Item>
                                                <strong>Téléphone:</strong> {verificationResult.diplomaInfo.studentPhone}
                                            </ListGroup.Item>
                                            <ListGroup.Item>
                                                <strong>Émetteur (adresse blockchain):</strong> 
                                                <code className="ms-2">{verificationResult.diplomaInfo.issuerAddress}</code>
                                            </ListGroup.Item>
                                            <ListGroup.Item>
                                                <strong>Enregistré le:</strong> {new Date(verificationResult.diplomaInfo.timestamp).toLocaleString()}
                                            </ListGroup.Item>
                                        </ListGroup>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Alert variant="warning">
                                ⚠️ Ce hash ne correspond à aucun diplôme enregistré sur la blockchain.
                                <br />
                                <small className="text-muted">
                                    Vérifiez que le hash est correct ou contactez l'institution émettrice.
                                </small>
                            </Alert>
                        )}
                    </Card.Body>
                </Card>
            )}
        </div>
    );
}

export default DiplomaVerification; 