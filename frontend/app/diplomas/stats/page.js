"use client";
import { useEffect, useState } from 'react';
import { Card, Spinner, Alert, Row, Col } from 'react-bootstrap';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { useAuth } from '../../AuthContext';

Chart.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const API_URL = 'http://localhost:5000/api';

export default function DiplomaStats() {
  const { isLoggedIn } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!isLoggedIn) {
      setError("Vous devez être connecté pour accéder à cette page.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    fetch(`${API_URL}/diplomas/stats`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(async res => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || 'Erreur lors de la récupération des statistiques.');
        }
        return res.json();
      })
      .then(data => setStats(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return <Alert variant="warning">Vous devez être connecté pour accéder à cette page.</Alert>;
  }

  if (loading) return <Spinner animation="border" />;
  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!stats) return null;

  // Préparation des données pour les graphiques
  const years = stats.byYear?.map(item => item.year) || [];
  const countsByYear = stats.byYear?.map(item => item.count) || [];
  const types = stats.byType?.map(item => item.diploma_type) || [];
  const countsByType = stats.byType?.map(item => item.count) || [];
  const institutions = stats.byInstitution?.map(item => item.issuer_institution) || [];
  const countsByInstitution = stats.byInstitution?.map(item => item.count) || [];

  return (
    <div className="container">
      <h3 className="mb-4">Statistiques des diplômes</h3>
      <Row className="mb-4">
        <Col md={4}>
          <Card className="mb-3">
            <Card.Body>
              <h5 className="mb-2">Total diplômes</h5>
              <div style={{ fontSize: 32, fontWeight: 700 }}>{stats.total}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="mb-3">
            <Card.Body>
              <h5 className="mb-2">Types de diplômes</h5>
              <Pie data={{
                labels: types,
                datasets: [{ data: countsByType, backgroundColor: ['#6366f1', '#f59e42', '#10b981', '#f43f5e', '#fbbf24'] }]
              }} />
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="mb-3">
            <Card.Body>
              <h5 className="mb-2">Par institution</h5>
              <Pie data={{
                labels: institutions,
                datasets: [{ data: countsByInstitution, backgroundColor: ['#6366f1', '#f59e42', '#10b981', '#f43f5e', '#fbbf24', '#0ea5e9'] }]
              }} />
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <Card>
        <Card.Body>
          <h5 className="mb-3">Évolution par année</h5>
          <Bar data={{
            labels: years,
            datasets: [{ label: 'Diplômes émis', data: countsByYear, backgroundColor: '#6366f1' }]
          }} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        </Card.Body>
      </Card>
    </div>
  );
} 