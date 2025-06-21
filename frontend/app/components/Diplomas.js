import { useState, useEffect } from 'react';
import { Table, Button, Form, Card, Alert } from 'react-bootstrap';
import DiplomaDetailModal from './DiplomaDetailModal';

const API_URL = 'http://localhost:5000/api';

function Diplomas({ token, userRole }) {
    const [diplomas, setDiplomas] = useState([]);
    const [error, setError] = useState(null);

    // États pour la modale de détails
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedDiploma, setSelectedDiploma] = useState(null);
    const [detailError, setDetailError] = useState(null);
    const [isDetailLoading, setIsDetailLoading] = useState(false);

    // États pour le formulaire d'ajout
    const [newDiploma, setNewDiploma] = useState({
        studentFirstName: '',
        studentLastName: '',
        diplomaTitle: '',
        issueDate: ''
    });

    const fetchDiplomas = async () => {
        try {
            const response = await fetch(`${API_URL}/diplomas`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Erreur lors de la récupération des diplômes');
            const data = await response.json();
            setDiplomas(data.diplomas || data);
        } catch (err) {
            setError(err.message);
        }
    };

    useEffect(() => {
        fetchDiplomas();
    }, [token]);

    const handleFormChange = (e) => {
        setNewDiploma({ ...newDiploma, [e.target.name]: e.target.value });
    };

    const handleAddDiploma = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            const response = await fetch(`${API_URL}/diplomas`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newDiploma)
            });
            if (!response.ok) {
                 const errData = await response.json();
                 throw new Error(errData.message || 'Erreur lors de la création du diplôme');
            }
            alert('Diplôme ajouté avec succès !');
            fetchDiplomas(); // Rafraîchir la liste
            // Reset form
            setNewDiploma({ studentFirstName: '', studentLastName: '', diplomaTitle: '', issueDate: '' });
        } catch (err) {
            setError(err.message);
        }
    };

    const handleShowDetails = async (diplomaId) => {
        setShowDetailModal(true);
        setIsDetailLoading(true);
        setDetailError(null);
        setSelectedDiploma(null);

        try {
            const response = await fetch(`${API_URL}/diplomas/${diplomaId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Impossible de charger les détails du diplôme.');
            }
            const data = await response.json();
            setSelectedDiploma(data.diploma || data);
        } catch (err) {
            setDetailError(err.message);
        } finally {
            setIsDetailLoading(false);
        }
    };

    return (
        <div>
            {error && <Alert variant="danger">{error}</Alert>}

            {['admin', 'emetteur'].includes(userRole) && (
                <Card className="mb-4">
                    <Card.Header>Ajouter un nouveau diplôme</Card.Header>
                    <Card.Body>
                        <Form onSubmit={handleAddDiploma}>
                            <Form.Group className="mb-3">
                                <Form.Label>Prénom de l'étudiant</Form.Label>
                                <Form.Control type="text" name="studentFirstName" value={newDiploma.studentFirstName} onChange={handleFormChange} required />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Nom de l'étudiant</Form.Label>
                                <Form.Control type="text" name="studentLastName" value={newDiploma.studentLastName} onChange={handleFormChange} required />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Intitulé du diplôme</Form.Label>
                                <Form.Control type="text" name="diplomaTitle" value={newDiploma.diplomaTitle} onChange={handleFormChange} required />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Date d'émission</Form.Label>
                                <Form.Control type="date" name="issueDate" value={newDiploma.issueDate} onChange={handleFormChange} required />
                            </Form.Group>
                            <Button type="submit" variant="primary">Ajouter</Button>
                        </Form>
                    </Card.Body>
                </Card>
            )}

            <h3>Liste des diplômes</h3>
            <Table striped bordered hover responsive>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Étudiant</th>
                        <th>Intitulé</th>
                        <th>Date d'émission</th>
                        <th>Statut Blockchain</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {diplomas.map(diploma => (
                        <tr key={diploma.id}>
                            <td>{diploma.id.substring(0, 8)}...</td>
                            <td>{diploma.student_firstname} {diploma.student_lastname}</td>
                            <td>{diploma.diploma_name}</td>
                            <td>{new Date(diploma.emission_date).toLocaleDateString()}</td>
                            <td>
                                <span className={`badge bg-${diploma.status === 'blockchain_confirmed' ? 'success' : 'warning'}`}>
                                    {diploma.status || 'pending'}
                                </span>
                            </td>
                            <td>
                                <Button variant="info" size="sm" onClick={() => handleShowDetails(diploma.id)}>
                                    Détails
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            <DiplomaDetailModal 
                show={showDetailModal}
                onHide={() => setShowDetailModal(false)}
                diploma={selectedDiploma}
                error={detailError}
                isLoading={isDetailLoading}
            />
        </div>
    );
}

export default Diplomas; 