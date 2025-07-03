class EmailService {
  constructor() {
    this.baseURL = 'http://localhost:5000/api';
  }

  // Envoyer un email de vérification
  async sendVerificationEmail(email) {
    try {
      const response = await fetch(`${this.baseURL}/auth/send-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'envoi de l\'email de vérification');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur envoi email vérification:', error);
      throw error;
    }
  }

  // Vérifier un token d'email
  async verifyEmailToken(token) {
    try {
      const response = await fetch(`${this.baseURL}/auth/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la vérification de l\'email');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur vérification email:', error);
      throw error;
    }
  }

  // Envoyer un email de réinitialisation de mot de passe
  async sendPasswordResetEmail(email) {
    try {
      const response = await fetch(`${this.baseURL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'envoi de l\'email de réinitialisation');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur envoi email réinitialisation:', error);
      throw error;
    }
  }

  // Réinitialiser le mot de passe avec un token
  async resetPassword(token, newPassword) {
    try {
      const response = await fetch(`${this.baseURL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la réinitialisation du mot de passe');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur réinitialisation mot de passe:', error);
      throw error;
    }
  }

  // Envoyer un email de notification de diplôme
  async sendDiplomaNotification(diplomaId, recipientEmail, notificationType) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      const response = await fetch(`${this.baseURL}/diplomas/${diplomaId}/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          recipientEmail, 
          notificationType 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'envoi de la notification');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur envoi notification diplôme:', error);
      throw error;
    }
  }

  // Envoyer un email de bienvenue
  async sendWelcomeEmail(userId) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      const response = await fetch(`${this.baseURL}/users/${userId}/welcome-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'envoi de l\'email de bienvenue');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur envoi email bienvenue:', error);
      throw error;
    }
  }

  // Vérifier le statut de l'envoi d'email
  async checkEmailStatus(emailId) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      const response = await fetch(`${this.baseURL}/emails/${emailId}/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la vérification du statut');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur vérification statut email:', error);
      throw error;
    }
  }

  // Obtenir l'historique des emails envoyés
  async getEmailHistory(page = 1, limit = 20) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      const response = await fetch(`${this.baseURL}/emails/history?page=${page}&limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la récupération de l\'historique');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur récupération historique emails:', error);
      throw error;
    }
  }
}

export default new EmailService(); 