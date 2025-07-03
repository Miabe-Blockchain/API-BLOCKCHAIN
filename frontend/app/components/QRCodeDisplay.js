"use client";

import { useState } from 'react';
import { Card, Button, Image, Alert, Spinner, Modal } from 'react-bootstrap';

const API_URL = 'http://localhost:5000/api';

function QRCodeDisplay({ diploma, token, onQRGenerated }) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const handleGenerateQR = async () => {
        if (!diploma || !diploma.id) return;
        
        setIsGenerating(true);
        setError(null);

        try {
            const response = await fetch(`${API_URL}/diplomas/${diploma.id}/qr-code`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de la génération du QR code');
            }

            // Mettre à jour le diplôme avec le nouveau QR code
            if (onQRGenerated) {
                onQRGenerated(data);
            }

            setShowModal(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownloadQR = () => {
        if (diploma.qr_code_url) {
            const link = document.createElement('a');
            link.href = diploma.qr_code_url;
            link.download = `diploma-${diploma.hash.substring(0, 8)}.png`;
            link.click();
        }
    };

    const handlePrintQR = () => {
        if (diploma.qr_code_url) {
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <html>
                    <head>
                        <title>QR Code - ${diploma.diploma_name}</title>
                        <style>
                            body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
                            .qr-container { margin: 20px auto; max-width: 400px; }
                            .qr-code { max-width: 300px; height: auto; border: 1px solid #ddd; }
                            .info { margin: 20px 0; }
                            .hash { font-family: monospace; background: #f5f5f5; padding: 10px; margin: 10px 0; }
                        </style>
                    </head>
                    <body>
                        <h2>QR Code de vérification</h2>
                        <div class="qr-container">
                            <img src="${diploma.qr_code_url}" alt="QR Code" class="qr-code" />
                            <div class="info">
                                <h3>${diploma.diploma_name}</h3>
                                <p><strong>Étudiant:</strong> ${diploma.student_firstname} ${diploma.student_lastname}</p>
                                <p><strong>Institution:</strong> ${diploma.issuer_institution}</p>
                                <p><strong>Hash:</strong></p>
                                <div class="hash">${diploma.hash}</div>
                                <p><small>Scannez ce QR code pour vérifier l'authenticité du diplôme</small></p>
                            </div>
                        </div>
                    </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.print();
        }
    };

    return (
        <>
            <Card>
                <Card.Header>
                    <div className="d-flex justify-content-between align-items-center">
                        <h6>QR Code de vérification</h6>
                        <Button 
                            variant="outline-primary" 
                            size="sm"
                            onClick={handleGenerateQR}
                            disabled={isGenerating}
                        >
                            {isGenerating ? (
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
                <Card.Body>
                    {error && (
                        <Alert variant="danger" onClose={() => setError(null)} dismissible>
                            {error}
                        </Alert>
                    )}

                    {diploma.qr_code_url ? (
                        <div className="text-center">
                            <Image 
                                src={diploma.qr_code_url} 
                                rounded 
                                fluid 
                                style={{ maxWidth: '250px', border: '1px solid #ddd' }} 
                                className="mb-3"
                            />
                            <p className="text-muted small mb-3">
                                Scannez ce QR code pour vérifier l'authenticité du diplôme
                            </p>
                            
                            <div className="d-flex gap-2 justify-content-center">
                                <Button 
                                    variant="outline-secondary" 
                                    size="sm"
                                    onClick={handleDownloadQR}
                                >
                                    📥 Télécharger
                                </Button>
                                <Button 
                                    variant="outline-secondary" 
                                    size="sm"
                                    onClick={handlePrintQR}
                                >
                                    🖨️ Imprimer
                                </Button>
                                <Button 
                                    variant="outline-info" 
                                    size="sm"
                                    onClick={() => setShowModal(true)}
                                >
                                    🔍 Voir détails
                                </Button>
                            </div>

                            <div className="mt-3">
                                <small className="text-muted">
                                    <strong>Hash:</strong> <code>{diploma.hash}</code>
                                </small>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-muted">
                            <p>Aucun QR code généré pour ce diplôme.</p>
                            <p>Cliquez sur "Générer QR Code" pour créer un QR code de vérification.</p>
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* Modal avec détails du QR code */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>QR Code de vérification</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {diploma.qr_code_url && (
                        <div className="text-center">
                            <Image 
                                src={diploma.qr_code_url} 
                                fluid 
                                style={{ maxWidth: '300px', border: '1px solid #ddd' }} 
                                className="mb-4"
                            />
                            
                            <h5>{diploma.diploma_name}</h5>
                            <p className="text-muted">
                                <strong>Étudiant:</strong> {diploma.student_firstname} {diploma.student_lastname}<br />
                                <strong>Institution:</strong> {diploma.issuer_institution}<br />
                                <strong>Hash:</strong> <code className="text-break">{diploma.hash}</code>
                            </p>
                            
                            <div className="mt-4">
                                <h6>Comment utiliser ce QR code :</h6>
                                <ul className="text-start">
                                    <li>Imprimez-le sur le diplôme physique</li>
                                    <li>Scannez-le avec un smartphone</li>
                                    <li>Vous serez redirigé vers la page de vérification</li>
                                    <li>Vérifiez l'authenticité du diplôme</li>
                                </ul>
                            </div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>
                        Fermer
                    </Button>
                    <Button variant="primary" onClick={handlePrintQR}>
                        Imprimer
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

export default QRCodeDisplay; 