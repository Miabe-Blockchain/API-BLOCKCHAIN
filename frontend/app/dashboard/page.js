"use client";
import { motion } from 'framer-motion';
import { useAuth } from '../AuthContext';
import { Card, Row, Col } from 'react-bootstrap';
import { FaCertificate, FaCheckCircle, FaUserShield, FaCog } from 'react-icons/fa';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuth();

  const quickActions = [
    {
      title: 'Gérer les diplômes',
      description: 'Ajouter, modifier et consulter les diplômes',
      icon: <FaCertificate size={24} />,
      href: '/diplomas/list',
      color: 'primary'
    },
    {
      title: 'Vérifier un diplôme',
      description: 'Vérifier l\'authenticité d\'un diplôme',
      icon: <FaCheckCircle size={24} />,
      href: '/verification/check',
      color: 'success'
    }
  ];

  // Ajouter les actions d'administration si l'utilisateur est admin
  if (user?.role === 'admin') {
    quickActions.push({
      title: 'Administration',
      description: 'Gérer les utilisateurs et les rôles',
      icon: <FaUserShield size={24} />,
      href: '/admin/users',
      color: 'warning'
    });
  }

  quickActions.push({
    title: 'Paramètres',
    description: 'Gérer votre profil et vos préférences',
    icon: <FaCog size={24} />,
    href: '/settings/profile',
    color: 'info'
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fade-in"
    >
      <div className="text-center mb-5">
        <h2 className="mb-3">Bienvenue, {user?.first_name || 'Utilisateur'} !</h2>
        <p className="text-muted">Sélectionnez une action rapide ou utilisez le menu à gauche pour naviguer.</p>
      </div>

      <Row className="g-4">
        {quickActions.map((action, index) => (
          <Col key={index} xs={12} sm={6} lg={4}>
            <Link href={action.href} style={{ textDecoration: 'none' }}>
              <Card className="h-100 shadow-sm border-0" style={{ cursor: 'pointer', transition: 'transform 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                <Card.Body className="text-center p-4">
                  <div className={`text-${action.color} mb-3`}>
                    {action.icon}
                  </div>
                  <Card.Title className="h5 mb-2">{action.title}</Card.Title>
                  <Card.Text className="text-muted small">{action.description}</Card.Text>
                </Card.Body>
              </Card>
            </Link>
          </Col>
        ))}
      </Row>
    </motion.div>
  );
} 