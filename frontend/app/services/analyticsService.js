class AnalyticsService {
  constructor() {
    this.baseURL = 'http://localhost:5000/api';
  }

  // Récupérer les statistiques générales
  async getGeneralStats() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      const response = await fetch(`${this.baseURL}/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la récupération des statistiques');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur récupération stats générales:', error);
      throw error;
    }
  }

  // Récupérer les logs d'activité
  async getActivityLogs(page = 1, limit = 20, filters = {}) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      });

      const response = await fetch(`${this.baseURL}/admin/logs?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la récupération des logs');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur récupération logs:', error);
      throw error;
    }
  }

  // Récupérer les statistiques de connexion par jour
  async getConnectionStats(days = 30) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      const response = await fetch(`${this.baseURL}/admin/analytics/connections?days=${days}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la récupération des stats de connexion');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur récupération stats connexion:', error);
      throw error;
    }
  }

  // Récupérer les statistiques des diplômes par période
  async getDiplomaStats(period = 'month') {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      const response = await fetch(`${this.baseURL}/admin/analytics/diplomas?period=${period}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la récupération des stats des diplômes');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur récupération stats diplômes:', error);
      throw error;
    }
  }

  // Récupérer les statistiques des vérifications
  async getVerificationStats(period = 'month') {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      const response = await fetch(`${this.baseURL}/admin/analytics/verifications?period=${period}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la récupération des stats de vérification');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur récupération stats vérification:', error);
      throw error;
    }
  }

  // Exporter les logs en CSV
  async exportLogsCSV(filters = {}) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      const params = new URLSearchParams({
        format: 'csv',
        ...filters
      });

      const response = await fetch(`${this.baseURL}/admin/logs/export?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'export des logs');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `logs-${new Date().toISOString().split('T')[0]}.csv`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true, message: 'Logs exportés avec succès' };
    } catch (error) {
      console.error('Erreur export logs:', error);
      throw error;
    }
  }

  // Récupérer les métriques de performance
  async getPerformanceMetrics() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      const response = await fetch(`${this.baseURL}/admin/analytics/performance`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la récupération des métriques de performance');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur récupération métriques performance:', error);
      throw error;
    }
  }
}

export default new AnalyticsService(); 