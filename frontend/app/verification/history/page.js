"use client";
import { useState, useEffect } from 'react';
import { Table, Spinner, Alert } from 'react-bootstrap';
import { useAuth } from '../../AuthContext';

const API_URL = 'http://localhost:5000/api';

function VerificationHistoryPanel() {
  const { isLoggedIn } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isLoggedIn) {
      setError("Vous devez être connecté pour accéder à cette page.");
      setLoading(false);
      return;
    }
    fetch(`${API_URL}/verifications`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => setHistory(data.verifications || data))
      .catch(() => setError('Erreur lors du chargement de l\'historique.'))
      .finally(() => setLoading(false));
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return <Alert variant="warning">Vous devez être connecté pour accéder à cette page.</Alert>;
  }

  return (
    <div className="container">
      <h3 className="mb-4">Historique des vérifications</h3>
      {loading ? <Spinner animation="border" /> : error ? <Alert variant="danger">{error}</Alert> : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Date</th>
              <th>Diplôme</th>
              <th>Utilisateur</th>
              <th>Résultat</th>
            </tr>
          </thead>
          <tbody>
            {history.map((item, idx) => (
              <tr key={idx}>
                <td>{new Date(item.created_at).toLocaleString()}</td>
                <td>{item.diploma_name}</td>
                <td>{item.user_email}</td>
                <td>{item.result ? '✅ Succès' : '❌ Échec'}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}

export default VerificationHistoryPanel; 