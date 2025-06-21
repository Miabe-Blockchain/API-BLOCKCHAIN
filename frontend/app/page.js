'use client';

import { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import LoginModal from './components/LoginModal';
import RegisterModal from './components/RegisterModal';
import Dashboard from './components/Dashboard';

export default function Home() {
  const [token, setToken] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const handleLogout = () => {
    setToken(null);
    alert('Vous avez été déconnecté.');
  };

  const handleLoginSuccess = (newToken) => {
    setToken(newToken);
    setShowLogin(false);
    alert('Connexion réussie !');
  };

  return (
    <div>
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container-fluid">
          <a className="navbar-brand" href="#">DiplomaChain</a>
          <div className="d-flex">
            {!token ? (
              <>
                <button className="btn btn-primary me-2" onClick={() => setShowLogin(true)}>Connexion</button>
                <button className="btn btn-secondary" onClick={() => setShowRegister(true)}>Inscription</button>
              </>
            ) : (
              <button className="btn btn-danger" onClick={handleLogout}>Déconnexion</button>
            )}
          </div>
        </div>
      </nav>

      <main className="container mt-4">
        {!token ? (
          <div className="text-center">
            <h1>Bienvenue sur DiplomaChain</h1>
            <p>Veuillez vous connecter ou vous inscrire pour gérer les diplômes.</p>
          </div>
        ) : (
          <Dashboard token={token} />
        )}
      </main>

      <LoginModal 
        show={showLogin} 
        onHide={() => setShowLogin(false)} 
        onLoginSuccess={handleLoginSuccess} 
      />
      <RegisterModal 
        show={showRegister} 
        onHide={() => setShowRegister(false)}
        onRegisterSuccess={() => {
            setShowRegister(false);
            alert('Inscription réussie ! Vous pouvez maintenant vous connecter.');
            setShowLogin(true); // Ouvre la modale de connexion après inscription
        }}
      />
    </div>
  );
}
