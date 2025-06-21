import { Modal, Button, Image, ListGroup, Spinner, Alert } from 'react-bootstrap';

function DiplomaDetailModal({ show, onHide, diploma, error, isLoading }) {
    
    const renderContent = () => {
        if (isLoading) {
            return <div className="text-center"><Spinner animation="border" /> <p>Chargement des détails...</p></div>;
        }

        if (error) {
            return <Alert variant="danger">{error}</Alert>;
        }

        if (!diploma) {
            return <p>Aucun diplôme sélectionné.</p>;
        }

        return (
            <>
                <div className="text-center mb-4">
                    <h5>{diploma.diploma_name}</h5>
                    <p className="text-muted">Délivré par {diploma.issuer_institution}</p>
                    <Image src={diploma.qr_code_url} rounded fluid style={{ maxWidth: '200px' }} />
                </div>
                <ListGroup variant="flush">
                    <ListGroup.Item><b>Étudiant :</b> {diploma.student_first_name} {diploma.student_last_name}</ListGroup.Item>
                    <ListGroup.Item><b>Date d'émission :</b> {new Date(diploma.issue_date).toLocaleDateString()}</ListGroup.Item>
                    <ListGroup.Item><b>Mention :</b> {diploma.mention}</ListGroup.Item>
                    <ListGroup.Item><b>Numéro de diplôme :</b> {diploma.diploma_number}</ListGroup.Item>
                    <ListGroup.Item><b>Statut :</b> <span className={`badge bg-${diploma.status === 'valid' ? 'success' : 'secondary'}`}>{diploma.status}</span></ListGroup.Item>
                </ListGroup>
                <hr />
                <h6>Informations Blockchain</h6>
                <ListGroup variant="flush">
                    <ListGroup.Item><b>Hash du diplôme :</b> <code className="text-break">{diploma.hash}</code></ListGroup.Item>
                    <ListGroup.Item><b>Hash de transaction :</b> 
                        {diploma.blockchain_tx_hash ? (
                            <a href={`https://sepolia.etherscan.io/tx/${diploma.blockchain_tx_hash}`} target="_blank" rel="noopener noreferrer">
                                {diploma.blockchain_tx_hash.substring(0, 20)}...
                            </a>
                        ) : 'Non enregistré'}
                    </ListGroup.Item>
                </ListGroup>
            </>
        );
    }

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