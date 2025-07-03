class PDFService {
  constructor() {
    this.baseURL = 'http://localhost:5000/api';
  }

  // Générer et télécharger un PDF de diplôme
  async generateDiplomaPDF(diplomaId) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      const response = await fetch(`${this.baseURL}/diplomas/${diplomaId}/pdf`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la génération du PDF');
      }

      // Récupérer le blob du PDF
      const blob = await response.blob();
      
      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `diplome-${diplomaId}.pdf`;
      
      // Déclencher le téléchargement
      document.body.appendChild(link);
      link.click();
      
      // Nettoyer
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true, message: 'PDF généré et téléchargé avec succès' };
    } catch (error) {
      console.error('Erreur génération PDF:', error);
      throw error;
    }
  }

  // Prévisualiser un PDF (ouvrir dans un nouvel onglet)
  async previewDiplomaPDF(diplomaId) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      const url = `${this.baseURL}/diplomas/${diplomaId}/pdf?preview=true`;
      
      // Ouvrir dans un nouvel onglet
      const newWindow = window.open(url, '_blank');
      
      if (!newWindow) {
        throw new Error('Impossible d\'ouvrir la prévisualisation. Vérifiez les bloqueurs de popup.');
      }

      return { success: true, message: 'Prévisualisation ouverte dans un nouvel onglet' };
    } catch (error) {
      console.error('Erreur prévisualisation PDF:', error);
      throw error;
    }
  }

  // Générer un PDF avec des données personnalisées
  async generateCustomPDF(diplomaData) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      const response = await fetch(`${this.baseURL}/diplomas/generate-pdf`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(diplomaData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la génération du PDF personnalisé');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `diplome-personnalise-${Date.now()}.pdf`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true, message: 'PDF personnalisé généré avec succès' };
    } catch (error) {
      console.error('Erreur génération PDF personnalisé:', error);
      throw error;
    }
  }
}

export default new PDFService(); 