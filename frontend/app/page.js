'use client';

import { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import LoginModal from './components/LoginModal';
import RegisterModal from './components/RegisterModal';
import Header from './components/Header';
import { useAuth } from './AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'react-toastify';

export default function Home() {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [creatingTestUser, setCreatingTestUser] = useState(false);
  const { isLoggedIn, isLoading, user } = useAuth();
  const router = useRouter();

  // Rediriger vers le dashboard si déjà connecté
  useEffect(() => {
    if (isLoggedIn && !isLoading) {
      router.push('/dashboard');
    }
  }, [isLoggedIn, isLoading, router]);

  const handleLoginSuccess = () => {
    setShowLogin(false);
    // La redirection se fait automatiquement via useEffect
  };

  const handleRegisterSuccess = () => {
    setShowRegister(false);
    alert('Inscription réussie ! Vous pouvez maintenant vous connecter.');
    setShowLogin(true);
  };

  const handleLogout = () => {
    // Cette fonction sera gérée par le contexte d'auth
    router.push('/');
  };

  const createTestAdmin = async () => {
    setCreatingTestUser(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/create-test-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Utilisateur de test créé ! Email: admin@test.com, Mot de passe: Admin123!');
        setShowLogin(true);
      } else {
        toast.error(data.error || 'Erreur lors de la création de l\'utilisateur de test');
      }
    } catch (error) {
      toast.error('Erreur de connexion au serveur');
    } finally {
      setCreatingTestUser(false);
    }
  };

  // Si en cours de chargement, afficher un spinner
  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  // Si connecté, ne rien afficher (redirection en cours)
  if (isLoggedIn) {
    return null;
  }

  return (
    <div>
      <Header 
        isLoggedIn={isLoggedIn} 
        onLogin={() => setShowLogin(true)} 
        onLogout={handleLogout}
        user={user}
      />
      <main className="container mt-5 d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '70vh' }}>
        <div className="text-center">
          <h1 className="mb-3 fw-bold" style={{ fontSize: '2.5rem' }}>Bienvenue sur DiplomaChain</h1>
          <p className="mb-4">Veuillez vous connecter ou vous inscrire pour gérer les diplômes.</p>
          <div className="d-flex justify-content-center gap-3 mb-3">
            <button className="btn btn-primary px-4" onClick={() => setShowLogin(true)}>Connexion</button>
            <button className="btn btn-secondary px-4" onClick={() => setShowRegister(true)}>Inscription</button>
          </div>
          <div className="mt-3">
            <button 
              className="btn btn-outline-warning btn-sm" 
              onClick={createTestAdmin}
              disabled={creatingTestUser}
            >
              {creatingTestUser ? 'Création...' : 'Créer utilisateur de test'}
            </button>
          </div>
        </div>
      </main>
      <LoginModal 
        show={showLogin} 
        onHide={() => setShowLogin(false)} 
        onLoginSuccess={handleLoginSuccess} 
      />
      <RegisterModal 
        show={showRegister} 
        onHide={() => setShowRegister(false)}
        onRegisterSuccess={handleRegisterSuccess}
      />
    </div>
  );
}
