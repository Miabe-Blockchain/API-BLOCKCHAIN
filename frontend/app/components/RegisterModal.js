"use client";

import { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import Skeleton from 'react-loading-skeleton';
import { FaUserPlus } from 'react-icons/fa';

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
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.message || "Erreur lors de l'inscription");
        throw new Error(data.message || "Erreur lors de l'inscription");
      }
      toast.success('Inscription réussie !');
      onRegisterSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered contentClassName="shadow-lg rounded-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="d-flex align-items-center gap-2">
            <FaUserPlus style={{ color: '#6366f1' }} /> Inscription
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <p className="text-danger text-center mb-3">{error}</p>}
          <Form onSubmit={handleSubmit} className="px-2">
            <Form.Group className="mb-3">
              <Form.Label>Prénom</Form.Label>
              <Form.Control type="text" name="firstName" onChange={handleChange} required autoFocus />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Nom</Form.Label>
              <Form.Control type="text" name="lastName" onChange={handleChange} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control type="email" name="email" onChange={handleChange} required autoComplete="username" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Mot de passe</Form.Label>
              <Form.Control type="password" name="password" onChange={handleChange} required autoComplete="new-password" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Téléphone</Form.Label>
              <Form.Control type="tel" name="phone" onChange={handleChange} />
            </Form.Group>
            <div className="d-grid">
              <Button variant="primary" type="submit" disabled={loading} className="rounded-pill shadow">
                {loading ? <Skeleton width={110} height={24} baseColor="#e0e7ff" highlightColor="#f1f5f9" /> : "S'inscrire"}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </motion.div>
    </Modal>
  );
}

export default RegisterModal; 