import { createContext, useContext, useState, useEffect } from 'react';
import notificationService from './services/notificationService';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState(null);

  // Vérifier le token au démarrage (côté client uniquement)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkAuthStatus = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const response = await fetch('http://localhost:5000/api/auth/verify-token', {
            headers: {
              'Authorization': `Bearer ${storedToken}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
            setIsLoggedIn(true);
            setToken(storedToken);
          } else {
            // Token invalide, le supprimer
            localStorage.removeItem('token');
            setUser(null);
            setIsLoggedIn(false);
            setToken(null);
          }
        } catch (error) {
          console.error('Erreur vérification token:', error);
          localStorage.removeItem('token');
          setUser(null);
          setIsLoggedIn(false);
          setToken(null);
        }
      } else {
        setToken(null);
      }
      setIsLoading(false);
    };

    checkAuthStatus();
  }, []);

  // Gérer les notifications en temps réel
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isLoggedIn && user?.id) {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        // Connecter aux notifications - DÉSACTIVÉ TEMPORAIREMENT
        // notificationService.connect(storedToken, user.id, user.role);
        // S'abonner aux notifications
        // const unsubscribe = notificationService.subscribe((notification) => {
        //   console.log('Notification reçue dans AuthContext:', notification);
        // });
        // return () => {
        //   unsubscribe();
        //   notificationService.disconnect();
        // };
      }
    } else {
      // notificationService.disconnect();
    }
  }, [isLoggedIn, user?.id, user?.role]);

  const login = (userData, token) => {
    setUser(userData);
    setIsLoggedIn(true);
    setToken(token);
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  };

  const logout = () => {
    setUser(null);
    setIsLoggedIn(false);
    setToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    notificationService.disconnect();
  };

  return (
    <AuthContext.Provider value={{ 
      isLoggedIn, 
      setIsLoggedIn, 
      user, 
      setUser, 
      isLoading,
      login,
      logout,
      token
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
} 