"use client";

import { useState, useEffect } from 'react';
import { Table, Button, Form, Card, Alert, Spinner } from 'react-bootstrap';
import DiplomaDetailModal from './DiplomaDetailModal';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import Skeleton from 'react-loading-skeleton';
import { FaPlusCircle, FaGraduationCap } from 'react-icons/fa';
import { useAuth } from '../AuthContext';

const API_URL = 'http://localhost:5000/api';

export function DiplomaList({ userRole }) {
    const { user, isLoggedIn } = useAuth();
    const [diplomas, setDiplomas] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedDiploma, setSelectedDiploma] = useState(null);
    const [detailError, setDetailError] = useState(null);
    const [isDetailLoading, setIsDetailLoading] = useState(false);

    useEffect(() => {
        if (!isLoggedIn) {
            setError("Vous devez être connecté pour accéder à cette page.");
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        fetch(`${API_URL}/diplomas`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
            .then(async res => {
                if (res.status === 403) {
                    throw new Error("Accès interdit : vous n'avez pas les droits nécessaires ou votre session a expiré.");
                }
                if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    throw new Error(data.message || 'Erreur lors de la récupération des diplômes');
                }
                return res.json();
            })
            .then(data => setDiplomas(data.diplomas || data))
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [isLoggedIn]);

    const handleShowDetails = async (diplomaId) => {
        setShowDetailModal(true);
        setIsDetailLoading(true);
        setDetailError(null);
        setSelectedDiploma(null);
        try {
            const response = await fetch(`${API_URL}/diplomas/${diplomaId}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
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

    if (!isLoggedIn) {
        return <Alert variant="warning">Vous devez être connecté pour accéder à la liste des diplômes.</Alert>;
    }

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            {error && <Alert variant="danger">{error}</Alert>}
            <Card className="mb-4 shadow-sm">
                <Card.Header className="d-flex align-items-center gap-2">
                    <FaGraduationCap style={{ color: '#6366f1' }} /> Liste des diplômes
                </Card.Header>
                <Card.Body>
                    {loading ? (
                        <Skeleton count={5} height={40} />
                    ) : (
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
                                {diplomas.map((diploma, idx) => (
                                    <tr key={diploma.id}>
                                        <td>{idx + 1}</td>
                                        <td>{diploma.student_firstname} {diploma.student_lastname}</td>
                                        <td>{diploma.diploma_name}</td>
                                        <td>{new Date(diploma.emission_date).toLocaleDateString()}</td>
                                        <td>{diploma.blockchain_registered_at ? 'Enregistré' : 'Non enregistré'}</td>
                                        <td>
                                            <Button size="sm" variant="outline-primary" onClick={() => handleShowDetails(diploma.id)}>
                                                Détails
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>
            <DiplomaDetailModal
                show={showDetailModal}
                onHide={() => setShowDetailModal(false)}
                diploma={selectedDiploma}
                error={detailError}
                isLoading={isDetailLoading}
            />
        </motion.div>
    );
}

export function DiplomaAddForm({ userRole }) {
    const { user } = useAuth();
    const [newDiploma, setNewDiploma] = useState({
        diploma_name: '',
        diploma_type: '',
        issuer_institution: '',
        emission_date: '',
        mention: '',
        diploma_number: '',
        student_firstname: '',
        student_lastname: '',
        student_birthdate: '',
        student_phone: ''
    });
    const [adding, setAdding] = useState(false);
    const [error, setError] = useState(null);
    const [choices, setChoices] = useState({
        diplomaTypes: [],
        mentions: []
    });

    // Initialiser l'institution avec celle de l'utilisateur connecté
    useEffect(() => {
        if (user?.institution_name) {
            setNewDiploma(prev => ({
                ...prev,
                issuer_institution: user.institution_name
            }));
        }
    }, [user]);

    // Récupérer les listes de choix
    useEffect(() => {
        const fetchChoices = async () => {
            try {
                const response = await fetch(`${API_URL}/diplomas/choices`);
                if (response.ok) {
                    const data = await response.json();
                    setChoices(data);
                } else {
                    console.warn('Erreur lors de la récupération des choix, utilisation des valeurs par défaut');
                    // Valeurs par défaut en cas d'erreur
                    setChoices({
                        diplomaTypes: [
                            'Licence', 'Master', 'Doctorat', 'BTS', 'DUT', 
                            'Certificat', 'Diplôme d\'ingénieur', 'CAP', 'Baccalauréat', 'Autre'
                        ],
                        mentions: [
                            'Passable', 'Assez bien', 'Bien', 'Très bien', 'Excellent', 'Sans mention'
                        ]
                    });
                }
            } catch (error) {
                console.error('Erreur lors de la récupération des choix:', error);
                // Valeurs par défaut en cas d'erreur
                setChoices({
                    diplomaTypes: [
                        'Licence', 'Master', 'Doctorat', 'BTS', 'DUT', 
                        'Certificat', 'Diplôme d\'ingénieur', 'CAP', 'Baccalauréat', 'Autre'
                    ],
                    mentions: [
                        'Passable', 'Assez bien', 'Bien', 'Très bien', 'Excellent', 'Sans mention'
                    ]
                });
            }
        };
        
        // Retry avec délai si le serveur n'est pas prêt
        const retryFetch = () => {
            fetchChoices().catch(() => {
                setTimeout(retryFetch, 2000); // Retry après 2 secondes
            });
        };
        
        retryFetch();
    }, []);

    const handleFormChange = (e) => {
        setNewDiploma({ ...newDiploma, [e.target.name]: e.target.value });
    };

    const handleAddDiploma = async (e) => {
        e.preventDefault();
        setError(null);
        setAdding(true);
        try {
            // Mapping des champs pour le backend
            const diplomaPayload = {
                diplomaTitle: newDiploma.diploma_name,
                diplomaType: newDiploma.diploma_type,
                issueDate: newDiploma.emission_date,
                mention: newDiploma.mention,
                diplomaNumber: newDiploma.diploma_number,
                studentFirstName: newDiploma.student_firstname,
                studentLastName: newDiploma.student_lastname,
                studentBirthdate: newDiploma.student_birthdate,
                studentPhone: newDiploma.student_phone
            };
            const response = await fetch(`${API_URL}/diplomas`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(diplomaPayload)
            });
            if (!response.ok) {
                const errData = await response.json();
                toast.error(errData.message || 'Erreur lors de la création du diplôme');
                throw new Error(errData.message || 'Erreur lors de la création du diplôme');
            }
            toast.success('Diplôme ajouté avec succès !');
            // Reset form
            setNewDiploma({
                diploma_name: '',
                diploma_type: '',
                issuer_institution: user?.institution_name || '',
                emission_date: '',
                mention: '',
                diploma_number: '',
                student_firstname: '',
                student_lastname: '',
                student_birthdate: '',
                student_phone: ''
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setAdding(false);
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            {error && <Alert variant="danger">{error}</Alert>}
            <Card className="mb-4 shadow-sm">
                <Card.Header className="d-flex align-items-center gap-2">
                    <FaPlusCircle style={{ color: '#6366f1' }} /> Ajouter un nouveau diplôme
                </Card.Header>
                <Card.Body>
                    <Form onSubmit={handleAddDiploma}>
                        <div className="row">
                            <div className="col-md-6">
                                <Form.Group className="mb-3">
                                    <Form.Label>Nom du diplôme *</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        name="diploma_name" 
                                        value={newDiploma.diploma_name} 
                                        onChange={handleFormChange} 
                                        required 
                                    />
                                </Form.Group>
                            </div>
                            <div className="col-md-6">
                                <Form.Group className="mb-3">
                                    <Form.Label>Type *</Form.Label>
                                    <Form.Select 
                                        name="diploma_type" 
                                        value={newDiploma.diploma_type} 
                                        onChange={handleFormChange} 
                                        required 
                                    >
                                        <option value="">Sélectionnez un type</option>
                                        {choices.diplomaTypes.map((type, index) => (
                                            <option key={index} value={type}>{type}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-md-6">
                                <Form.Group className="mb-3">
                                    <Form.Label>Institution *</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        name="issuer_institution" 
                                        value={newDiploma.issuer_institution} 
                                        onChange={handleFormChange} 
                                        disabled
                                        className="bg-light"
                                        title="L'institution est automatiquement définie selon votre profil"
                                    />
                                    <Form.Text className="text-muted">
                                        Votre institution est automatiquement sélectionnée
                                    </Form.Text>
                                </Form.Group>
                            </div>
                            <div className="col-md-6">
                                <Form.Group className="mb-3">
                                    <Form.Label>Date d'émission *</Form.Label>
                                    <Form.Control 
                                        type="date" 
                                        name="emission_date" 
                                        value={newDiploma.emission_date} 
                                        onChange={handleFormChange} 
                                        required 
                                    />
                                </Form.Group>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-md-6">
                                <Form.Group className="mb-3">
                                    <Form.Label>Mention</Form.Label>
                                    <Form.Select 
                                        name="mention" 
                                        value={newDiploma.mention} 
                                        onChange={handleFormChange} 
                                    >
                                        <option value="">Sélectionnez une mention</option>
                                        {choices.mentions.map((mention, index) => (
                                            <option key={index} value={mention}>{mention}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </div>
                            <div className="col-md-6">
                                <Form.Group className="mb-3">
                                    <Form.Label>Numéro du diplôme *</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        name="diploma_number" 
                                        value={newDiploma.diploma_number} 
                                        onChange={handleFormChange} 
                                        required 
                                    />
                                </Form.Group>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-md-6">
                                <Form.Group className="mb-3">
                                    <Form.Label>Prénom étudiant *</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        name="student_firstname" 
                                        value={newDiploma.student_firstname} 
                                        onChange={handleFormChange} 
                                        required 
                                    />
                                </Form.Group>
                            </div>
                            <div className="col-md-6">
                                <Form.Group className="mb-3">
                                    <Form.Label>Nom étudiant *</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        name="student_lastname" 
                                        value={newDiploma.student_lastname} 
                                        onChange={handleFormChange} 
                                        required 
                                    />
                                </Form.Group>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-md-6">
                                <Form.Group className="mb-3">
                                    <Form.Label>Date de naissance *</Form.Label>
                                    <Form.Control 
                                        type="date" 
                                        name="student_birthdate" 
                                        value={newDiploma.student_birthdate} 
                                        onChange={handleFormChange} 
                                        required 
                                    />
                                </Form.Group>
                            </div>
                            <div className="col-md-6">
                                <Form.Group className="mb-3">
                                    <Form.Label>Téléphone étudiant</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        name="student_phone" 
                                        value={newDiploma.student_phone} 
                                        onChange={handleFormChange} 
                                    />
                                </Form.Group>
                            </div>
                        </div>
                        <Button type="submit" className="w-100" variant="primary" disabled={adding}>
                            {adding ? 'Ajout en cours...' : 'Ajouter le diplôme'}
                        </Button>
                        <Button 
                            variant="outline-info" 
                            className="w-100 mt-2"
                            onClick={async (e) => {
                                e.preventDefault();
                                try {
                                    // Mapping des champs pour le backend (camelCase)
                                    const diplomaPayload = {
                                        diplomaTitle: newDiploma.diploma_name,
                                        diplomaType: newDiploma.diploma_type,
                                        issueDate: newDiploma.emission_date,
                                        mention: newDiploma.mention,
                                        diplomaNumber: newDiploma.diploma_number,
                                        studentFirstName: newDiploma.student_firstname,
                                        studentLastName: newDiploma.student_lastname,
                                        studentBirthdate: newDiploma.student_birthdate,
                                        studentPhone: newDiploma.student_phone
                                    };
                                    const response = await fetch(`${API_URL}/blockchain/estimate-gas`, {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json',
                                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                                        },
                                        body: JSON.stringify(diplomaPayload)
                                    });
                                    const data = await response.json();
                                    if (!response.ok) throw new Error(data.error || 'Erreur lors de l\'estimation du coût');
                                    alert(`Coût estimé du stockage sur la blockchain : ${data.estimatedGas} gas (${data.estimatedEth} ETH)`);
                                } catch (err) {
                                    alert('Erreur lors de l\'estimation du coût : ' + (err.message || err));
                                }
                            }}
                        >
                            Estimer le coût blockchain
                        </Button>
                    </Form>
                </Card.Body>
            </Card>
        </motion.div>
    );
}

export default function Diplomas({ userRole }) {
    // Wrapper rétrocompatible
    return <><DiplomaAddForm userRole={userRole} /><DiplomaList userRole={userRole} /></>;
} 