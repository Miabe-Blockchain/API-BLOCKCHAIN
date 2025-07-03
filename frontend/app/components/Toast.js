'use client';

import { useState, useEffect } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';

const ToastComponent = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    // Fonction globale pour afficher des toasts
    window.showToast = (title, message, type = 'info') => {
      const id = Date.now();
      const newToast = {
        id,
        title,
        message,
        type,
        show: true
      };
      
      setToasts(prev => [...prev, newToast]);
      
      // Auto-remove après 5 secondes
      setTimeout(() => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
      }, 5000);
    };

    return () => {
      delete window.showToast;
    };
  }, []);

  const handleClose = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const getToastVariant = (type) => {
    switch (type) {
      case 'success': return 'success';
      case 'error': return 'danger';
      case 'warning': return 'warning';
      case 'diploma_created': return 'success';
      case 'diploma_registered': return 'info';
      case 'diploma_verified': return 'success';
      case 'system_maintenance': return 'warning';
      case 'new_user': return 'info';
      default: return 'info';
    }
  };

  const getToastIcon = (type) => {
    switch (type) {
      case 'success':
      case 'diploma_created':
      case 'diploma_verified':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
      case 'system_maintenance':
        return '⚠️';
      case 'info':
      case 'diploma_registered':
      case 'new_user':
        return 'ℹ️';
      default:
        return 'ℹ️';
    }
  };

  return (
    <ToastContainer position="top-end" className="p-3" style={{ zIndex: 9999 }}>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          show={toast.show}
          onClose={() => handleClose(toast.id)}
          bg={getToastVariant(toast.type)}
          delay={5000}
          autohide
        >
          <Toast.Header>
            <strong className="me-auto">
              {getToastIcon(toast.type)} {toast.title}
            </strong>
            <small>{new Date().toLocaleTimeString()}</small>
          </Toast.Header>
          <Toast.Body className={getToastVariant(toast.type) === 'danger' ? 'text-white' : ''}>
            {toast.message}
          </Toast.Body>
        </Toast>
      ))}
    </ToastContainer>
  );
};

export default ToastComponent; 