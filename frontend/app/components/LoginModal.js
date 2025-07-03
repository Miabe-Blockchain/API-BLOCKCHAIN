"use client";

import { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import Skeleton from 'react-loading-skeleton';
import { FaSignInAlt } from 'react-icons/fa';
import { useAuth } from '../AuthContext';

const API_URL = 'http://localhost:5000/api';

function LoginModal({ show, onHide, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || 'Erreur de connexion');
        throw new Error(data.message || 'Erreur de connexion');
      }

      login(data.user, data.token);
      
      toast.success('Connexion réussie !');
      onLoginSuccess();
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
            <FaSignInAlt style={{ color: '#6366f1' }} /> Connexion
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <p className="text-danger text-center mb-3">{error}</p>}
          <Form onSubmit={handleSubmit} className="px-2">
            <Form.Group className="mb-3" controlId="login-email">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                autoComplete="username"
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="login-password">
              <Form.Label>Mot de passe</Form.Label>
              <Form.Control
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </Form.Group>
            <div className="d-grid">
              <Button variant="primary" type="submit" disabled={loading} className="rounded-pill shadow">
                {loading ? <Skeleton width={90} height={24} baseColor="#e0e7ff" highlightColor="#f1f5f9" /> : 'Se connecter'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </motion.div>
    </Modal>
  );
}

export default LoginModal; 