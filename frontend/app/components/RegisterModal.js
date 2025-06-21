import { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

const API_URL = 'http://localhost:5000/api';

function RegisterModal({ show, onHide, onRegisterSuccess }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: ''
  });
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de l\'inscription');
      }

      onRegisterSuccess();

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Inscription</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <p className="text-danger">{error}</p>}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Prénom</Form.Label>
            <Form.Control type="text" name="firstName" onChange={handleChange} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Nom</Form.Label>
            <Form.Control type="text" name="lastName" onChange={handleChange} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control type="email" name="email" onChange={handleChange} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Mot de passe</Form.Label>
            <Form.Control type="password" name="password" onChange={handleChange} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Téléphone</Form.Label>
            <Form.Control type="tel" name="phone" onChange={handleChange} />
          </Form.Group>
          <Button variant="primary" type="submit">
            S'inscrire
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
}

export default RegisterModal; 