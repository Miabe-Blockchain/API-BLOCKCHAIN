"use client";

import { useState } from 'react';
import { Modal, Button, Image, ListGroup, Spinner, Alert, Badge, Card, Row, Col } from 'react-bootstrap';
import pdfService from '../services/pdfService';
import { toast } from 'react-toastify';

const API_URL = 'http://localhost:5000/api';

function DiplomaDetailModal({ show, onHide, diploma, error, isLoading }) {
    const [isRegistering, setIsRegistering] = useState(false);
    const [isGeneratingQR, setIsGeneratingQR] = useState(false);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [registerError, setRegisterError] = useState(null);
    const [registerSuccess, setRegisterSuccess] = useState(null);
    const [qrError, setQrError] = useState(null);
    const [qrSuccess, setQrSuccess] = useState(null);

    const handleRegisterOnBlockchain = async () => {
        if (!diploma || !diploma.id) return;
        
        setIsRegistering(true);
        setRegisterError(null);
        setRegisterSuccess(null);

        try {
            const response = await fetch(`${API_URL}/diplomas/${diploma.id}/register-blockchain`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de l\'enregistrement sur la blockchain');
            }

            setRegisterSuccess({
                message: 'Diplôme enregistré avec succès sur la blockchain !',
                transactionHash: data.blockchain?.transactionHash,
                blockNumber: data.blockchain?.blockNumber
            });

            // Rafraîchir les données du diplôme
            setTimeout(() => {
                window.location.reload();
            }, 2000);

        } catch (err) {
            setRegisterError(err.message);
        } finally {
            setIsRegistering(false);
        }
    };

    const handleGenerateQR = async () => {
        if (!diploma || !diploma.id) return;
        
        setIsGeneratingQR(true);
        setQrError(null);
        setQrSuccess(null);

        try {
            const response = await fetch(`${API_URL}/diplomas/${diploma.id}/qr-code`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de la génération du QR code');
            }

            setQrSuccess({
                message: 'QR code généré avec succès !',
                qr_code_url: data.qr_code_url,
                verification_url: data.verification_url
            });

            // Mettre à jour le diplôme avec le nouveau QR code
            diploma.qr_code_url = data.qr_code_url;

        } catch (err) {
            setQrError(err.message);
        } finally {
            setIsGeneratingQR(false);
        }
    };

    const handleGeneratePDF = async () => {
        if (!diploma || !diploma.id) return;
        
        setIsGeneratingPDF(true);
        try {
            await pdfService.generateDiplomaPDF(diploma.id);
            toast.success('PDF généré et téléchargé avec succès !');
        } catch (error) {
            toast.error('Erreur lors de la génération du PDF: ' + error.message);
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    const handlePreviewPDF = async () => {
        if (!diploma || !diploma.id) return;
        
        try {
            await pdfService.previewDiplomaPDF(diploma.id);
        } catch (error) {
            toast.error('Erreur lors de la prévisualisation: ' + error.message);
        }
    };

    const handleExportPDF = async () => {
        if (!diploma || !diploma.id) return;
        
        try {
            const response = await fetch(`${API_URL}/diplomas/${diploma.id}/export-pdf`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Erreur lors de l\'export PDF');
            }

            // Créer un blob et télécharger le PDF
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `diploma-${diploma.student_firstname}-${diploma.student_lastname}-${diploma.diploma_number}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

        } catch (err) {
            alert('Erreur lors de l\'export PDF: ' + err.message);
        }
    };
    
    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="text-center">
                    <Spinner animation="border" role="status">
                        <span className="visually-hidden">Chargement...</span>
                    </Spinner>
                    <p className="mt-3">Chargement des détails...</p>
                </div>
            );
        }

        if (error) {
            return <Alert variant="danger">{error}</Alert>;
        }

        if (!diploma) {
            return <p>Aucun diplôme sélectionné.</p>;
        }

        return (
            <>
                {registerError && (
                    <Alert variant="danger" onClose={() => setRegisterError(null)} dismissible>
                        {registerError}
                    </Alert>
                )}

                {registerSuccess && (
                    <Alert variant="success" onClose={() => setRegisterSuccess(null)} dismissible>
                        <h6>✅ {registerSuccess.message}</h6>
                        {registerSuccess.transactionHash && (
                            <p className="mb-1">
                                <strong>Transaction Hash:</strong> 
                                <a 
                                    href={`https://sepolia.etherscan.io/tx/${registerSuccess.transactionHash}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="ms-2"
                                >
                                    {registerSuccess.transactionHash.substring(0, 10)}...
                                </a>
                            </p>
                        )}
                        {registerSuccess.blockNumber && (
                            <p className="mb-0">
                                <strong>Block:</strong> {registerSuccess.blockNumber}
                            </p>
                        )}
                    </Alert>
                )}

                {qrError && (
                    <Alert variant="danger" onClose={() => setQrError(null)} dismissible>
                        {qrError}
                    </Alert>
                )}

                {qrSuccess && (
                    <Alert variant="success" onClose={() => setQrSuccess(null)} dismissible>
                        <h6>✅ {qrSuccess.message}</h6>
                        {qrSuccess.verification_url && (
                            <p className="mb-0">
                                <strong>URL de vérification:</strong> 
                                <a 
                                    href={qrSuccess.verification_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="ms-2"
                                >
                                    {qrSuccess.verification_url}
                                </a>
                            </p>
                        )}
                    </Alert>
                )}

                <div className="text-center mb-4">
                    <h5>{diploma.diploma_name}</h5>
                    <p className="text-muted">Délivré par {diploma.issuer_institution}</p>
                </div>

                {/* Section QR Code */}
                <Card className="mb-4">
                    <Card.Header>
                        <div className="d-flex justify-content-between align-items-center">
                            <h6>QR Code de vérification</h6>
                            <Button 
                                variant="outline-primary" 
                                size="sm"
                                onClick={handleGenerateQR}
                                disabled={isGeneratingQR}
                            >
                                {isGeneratingQR ? (
                                    <>
                                        <Spinner animation="border" size="sm" className="me-2" />
                                        Génération...
                                    </>
                                ) : (
                                    diploma.qr_code_url ? 'Regénérer QR Code' : 'Générer QR Code'
                                )}
                            </Button>
                        </div>
                    </Card.Header>
                    <Card.Body className="text-center">
                        {diploma.qr_code_url ? (
                            <div>
                                <Image 
                                    src={diploma.qr_code_url} 
                                    rounded 
                                    fluid 
                                    style={{ maxWidth: '250px', border: '1px solid #ddd' }} 
                                    className="mb-3"
                                />
                                <p className="text-muted small">
                                    Scannez ce QR code pour vérifier l'authenticité du diplôme
                                </p>
                                <Button 
                                    variant="outline-secondary" 
                                    size="sm"
                                    onClick={() => {
                                        const link = document.createElement('a');
                                        link.href = diploma.qr_code_url;
                                        link.download = `diploma-${diploma.hash.substring(0, 8)}.png`;
                                        link.click();
                                    }}
                                >
                                    Télécharger QR Code
                                </Button>
                            </div>
                        ) : (
                            <div className="py-4">
                                <p className="text-muted">Aucun QR code généré pour ce diplôme</p>
                                <Button 
                                    variant="primary" 
                                    onClick={handleGenerateQR}
                                    disabled={isGeneratingQR}
                                >
                                    {isGeneratingQR ? (
                                        <>
                                            <Spinner animation="border" size="sm" className="me-2" />
                                            Génération...
                                        </>
                                    ) : (
                                        'Générer le QR Code'
                                    )}
                                </Button>
                            </div>
                        )}
                    </Card.Body>
                </Card>

                <Row>
                    <Col md={6}>
                        <Card className="mb-3">
                            <Card.Header>Informations du diplôme</Card.Header>
                            <Card.Body>
                                <ListGroup variant="flush">
                                    <ListGroup.Item><b>Type:</b> {diploma.diploma_type}</ListGroup.Item>
                                    <ListGroup.Item><b>Date d'émission:</b> {new Date(diploma.emission_date).toLocaleDateString()}</ListGroup.Item>
                                    <ListGroup.Item><b>Mention:</b> {diploma.mention || 'Non spécifiée'}</ListGroup.Item>
                                    <ListGroup.Item><b>Numéro:</b> {diploma.diploma_number}</ListGroup.Item>
                                </ListGroup>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={6}>
                        <Card className="mb-3">
                            <Card.Header>Informations de l'étudiant</Card.Header>
                            <Card.Body>
                                <ListGroup variant="flush">
                                    <ListGroup.Item><b>Nom complet:</b> {diploma.student_firstname} {diploma.student_lastname}</ListGroup.Item>
                                    <ListGroup.Item><b>Date de naissance:</b> {new Date(diploma.student_birthdate).toLocaleDateString()}</ListGroup.Item>
                                    <ListGroup.Item><b>Téléphone:</b> {diploma.student_phone}</ListGroup.Item>
                                </ListGroup>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                <Card className="mb-3">
                    <Card.Header>Statut Blockchain</Card.Header>
                    <Card.Body>
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <p className="mb-1">
                                    <strong>Statut:</strong> 
                                    <Badge 
                                        bg={diploma.blockchain_registered_at ? 'success' : 'warning'} 
                                        className="ms-2"
                                    >
                                        {diploma.blockchain_registered_at ? 'Enregistré sur la blockchain' : 'En attente d\'enregistrement'}
                                    </Badge>
                                </p>
                                {diploma.blockchain_registered_at && (
                                    <p className="mb-1">
                                        <strong>Date d'enregistrement:</strong> {new Date(diploma.blockchain_registered_at).toLocaleString()}
                                    </p>
                                )}
                                {diploma.blockchain_transaction_hash && (
                                    <>
                                        <p className="mb-0">
                                            <strong>Transaction:</strong> 
                                            <a 
                                                href={`https://sepolia.etherscan.io/tx/${diploma.blockchain_transaction_hash}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="ms-2"
                                            >
                                                Voir sur Etherscan
                                            </a>
                                        </p>
                                        <Button 
                                            variant="outline-info" 
                                            size="sm" 
                                            className="mt-2"
                                            onClick={async () => {
                                                try {
                                                    const response = await fetch(`${API_URL}/blockchain/transaction/${diploma.blockchain_transaction_hash}`, {
                                                        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                                                    });
                                                    const data = await response.json();
                                                    if (!response.ok) throw new Error(data.error || 'Erreur lors de la récupération de la transaction');
                                                    alert(`Bloc: ${data.blockNumber}\nDe: ${data.from}\nÀ: ${data.to}\nMontant: ${data.value} ETH\nHash: ${data.hash}`);
                                                } catch (err) {
                                                    alert('Erreur lors de la récupération de la transaction: ' + (err.message || err));
                                                }
                                            }}
                                        >
                                            Détails transaction blockchain
                                        </Button>
                                    </>
                                )}
                            </div>
                            {!diploma.blockchain_registered_at && (
                                <Button 
                                    variant="primary" 
                                    onClick={handleRegisterOnBlockchain}
                                    disabled={isRegistering}
                                >
                                    {isRegistering ? (
                                        <>
                                            <Spinner animation="border" size="sm" className="me-2" />
                                            Enregistrement...
                                        </>
                                    ) : (
                                        'Enregistrer sur la blockchain'
                                    )}
                                </Button>
                            )}
                        </div>
                    </Card.Body>
                </Card>

                <Card>
                    <Card.Header>Informations techniques</Card.Header>
                    <Card.Body>
                        <ListGroup variant="flush">
                            <ListGroup.Item><b>ID du diplôme:</b> {diploma.id}</ListGroup.Item>
                            <ListGroup.Item><b>Hash:</b> <code className="text-break">{diploma.hash}</code></ListGroup.Item>
                            <ListGroup.Item><b>Créé le:</b> {new Date(diploma.created_at).toLocaleString()}</ListGroup.Item>
                            {diploma.updated_at && (
                                <ListGroup.Item><b>Modifié le:</b> {new Date(diploma.updated_at).toLocaleString()}</ListGroup.Item>
                            )}
                        </ListGroup>
                    </Card.Body>
                </Card>

                <div className="text-center mt-4">
                    <Button 
                        variant="outline-primary" 
                        onClick={handleGeneratePDF}
                        disabled={isGeneratingPDF}
                        className="me-2"
                    >
                        {isGeneratingPDF ? (
                            <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Génération...
                            </>
                        ) : (
                            '📄 Télécharger PDF'
                        )}
                    </Button>
                    <Button 
                        variant="outline-info" 
                        onClick={handlePreviewPDF}
                        className="me-2"
                    >
                        👁️ Prévisualiser PDF
                    </Button>
                    <Button 
                        variant="outline-secondary" 
                        onClick={() => window.print()}
                    >
                        🖨️ Imprimer
                    </Button>
                </div>
            </>
        );
    };

    return (
        <Modal show={show} onHide={onHide} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>Détails du Diplôme</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {renderContent()}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    Fermer
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default DiplomaDetailModal; 