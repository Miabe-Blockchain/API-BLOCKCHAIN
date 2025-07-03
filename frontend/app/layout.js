"use client";
import './globals.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import Sidebar from './components/Sidebar';
import ToastComponent from './components/Toast';
import { ToastContainer } from 'react-toastify';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from './AuthContext';
import { Spinner } from 'react-bootstrap';

function LayoutContent({ children }) {
  const router = useRouter();
  const { isLoggedIn, setIsLoggedIn, user, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 992;

  // Déconnexion
  const handleLogout = () => {
    setIsLoggedIn(false);
    router.push('/');
  };

  // Affichage du profil
  const handleProfile = () => {
    router.push('/dashboard?tab=settings');
    setSidebarOpen(false);
  };

  // Afficher un spinner pendant le chargement
  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Chargement...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      {/* Sidebar visible uniquement si connecté */}
      {isLoggedIn && user && (
        <div className={isMobile && !sidebarOpen ? 'd-none' : ''}>
          <Sidebar
            activeTab={''}
            isAdmin={user.role === 'admin'}
            isVerifier={user.role === 'verificateur'}
            user={user}
            onLogout={handleLogout}
            onProfile={handleProfile}
            onTabChange={() => isMobile && setSidebarOpen(false)}
          />
        </div>
      )}
      {/* Overlay pour mobile */}
      {isMobile && sidebarOpen && isLoggedIn && user && (
        <div
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.2)', zIndex: 99 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}
      {/* Contenu principal */}
      <main style={{ flex: 1, marginLeft: isLoggedIn && user ? (isMobile ? 0 : 220) : 0, padding: 24 }}>
        {/* Bouton menu burger sur mobile */}
        {isMobile && isLoggedIn && user && (
          <button
            className="btn btn-outline-primary mb-3"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ position: 'fixed', top: 20, left: 10, zIndex: 200 }}
          >
            <span className="navbar-toggler-icon" />
          </button>
        )}
        <div className="fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body style={{ background: '#f8fafc' }}>
        <AuthProvider>
          <LayoutContent>{children}</LayoutContent>
          <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
          <ToastComponent />
        </AuthProvider>
      </body>
    </html>
  );
}
