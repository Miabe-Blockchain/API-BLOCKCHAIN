const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class PDFService {
  async generateDiplomaPDF(diploma) {
    try {
      const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      
      // Template HTML pour le diplôme
      const htmlContent = this.generateDiplomaHTML(diploma);
      
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      // Configuration du PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm'
        }
      });

      await browser.close();
      
      return pdfBuffer;
    } catch (error) {
      throw new Error('Erreur génération PDF: ' + error.message);
    }
  }

  generateDiplomaHTML(diploma) {
    const currentDate = new Date().toLocaleDateString('fr-FR');
    const emissionDate = new Date(diploma.emission_date).toLocaleDateString('fr-FR');
    const birthDate = new Date(diploma.student_birthdate).toLocaleDateString('fr-FR');

    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Diplôme - ${diploma.diploma_name}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Roboto:wght@300;400;500&display=swap');
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Roboto', sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
          }
          
          .diploma-container {
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
            max-width: 800px;
            margin: 0 auto;
            position: relative;
          }
          
          .diploma-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
            position: relative;
          }
          
          .diploma-header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
            opacity: 0.3;
          }
          
          .diploma-title {
            font-family: 'Playfair Display', serif;
            font-size: 2.5em;
            font-weight: 700;
            margin-bottom: 10px;
            position: relative;
            z-index: 1;
          }
          
          .diploma-subtitle {
            font-size: 1.2em;
            opacity: 0.9;
            position: relative;
            z-index: 1;
          }
          
          .diploma-content {
            padding: 40px;
          }
          
          .diploma-section {
            margin-bottom: 30px;
          }
          
          .section-title {
            font-family: 'Playfair Display', serif;
            font-size: 1.5em;
            color: #667eea;
            margin-bottom: 15px;
            border-bottom: 2px solid #667eea;
            padding-bottom: 5px;
          }
          
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
          }
          
          .info-item {
            display: flex;
            flex-direction: column;
          }
          
          .info-label {
            font-weight: 500;
            color: #666;
            font-size: 0.9em;
            margin-bottom: 5px;
          }
          
          .info-value {
            font-size: 1.1em;
            color: #333;
            font-weight: 400;
          }
          
          .student-name {
            font-family: 'Playfair Display', serif;
            font-size: 2em;
            text-align: center;
            color: #667eea;
            margin: 30px 0;
            padding: 20px;
            border: 3px solid #667eea;
            border-radius: 10px;
            background: linear-gradient(135deg, #f8f9ff 0%, #e8f0ff 100%);
          }
          
          .diploma-footer {
            background: #f8f9fa;
            padding: 30px 40px;
            text-align: center;
            border-top: 1px solid #e9ecef;
          }
          
          .qr-section {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 20px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 10px;
          }
          
          .qr-info {
            flex: 1;
          }
          
          .qr-code {
            width: 100px;
            height: 100px;
            border: 1px solid #ddd;
            border-radius: 5px;
          }
          
          .blockchain-info {
            background: #e8f5e8;
            padding: 15px;
            border-radius: 8px;
            margin-top: 20px;
            border-left: 4px solid #28a745;
          }
          
          .blockchain-status {
            display: inline-block;
            background: #28a745;
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.9em;
            margin-bottom: 10px;
          }
          
          .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 4em;
            color: rgba(102, 126, 234, 0.1);
            font-family: 'Playfair Display', serif;
            font-weight: 700;
            pointer-events: none;
            z-index: 0;
          }
          
          @media print {
            body {
              background: white;
              padding: 0;
            }
            .diploma-container {
              box-shadow: none;
              border-radius: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="diploma-container">
          <div class="watermark">DIPLÔME</div>
          
          <div class="diploma-header">
            <h1 class="diploma-title">Diplôme</h1>
            <p class="diploma-subtitle">Certificat d'études supérieures</p>
          </div>
          
          <div class="diploma-content">
            <div class="diploma-section">
              <h2 class="section-title">Informations du diplôme</h2>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Intitulé du diplôme</span>
                  <span class="info-value">${diploma.diploma_name}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Type de diplôme</span>
                  <span class="info-value">${diploma.diploma_type}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Institution émettrice</span>
                  <span class="info-value">${diploma.issuer_institution}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Date d'émission</span>
                  <span class="info-value">${emissionDate}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Mention</span>
                  <span class="info-value">${diploma.mention || 'Non spécifiée'}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Numéro de diplôme</span>
                  <span class="info-value">${diploma.diploma_number}</span>
                </div>
              </div>
            </div>
            
            <div class="diploma-section">
              <h2 class="section-title">Informations de l'étudiant</h2>
              <div class="student-name">
                ${diploma.student_firstname} ${diploma.student_lastname}
              </div>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Date de naissance</span>
                  <span class="info-value">${birthDate}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Numéro de téléphone</span>
                  <span class="info-value">${diploma.student_phone}</span>
                </div>
              </div>
            </div>
            
            ${diploma.blockchain_registered_at ? `
            <div class="blockchain-info">
              <div class="blockchain-status">✅ Enregistré sur la blockchain</div>
              <p><strong>Date d'enregistrement:</strong> ${new Date(diploma.blockchain_registered_at).toLocaleString('fr-FR')}</p>
              ${diploma.blockchain_transaction_hash ? `
              <p><strong>Transaction:</strong> ${diploma.blockchain_transaction_hash.substring(0, 20)}...</p>
              ` : ''}
            </div>
            ` : ''}
            
            <div class="qr-section">
              <div class="qr-info">
                <h4>Vérification du diplôme</h4>
                <p>Scannez le QR code ou visitez le lien pour vérifier l'authenticité de ce diplôme.</p>
                <p><strong>Hash:</strong> ${diploma.hash}</p>
              </div>
              ${diploma.qr_code_url ? `
              <img src="${diploma.qr_code_url}" alt="QR Code de vérification" class="qr-code">
              ` : ''}
            </div>
          </div>
          
          <div class="diploma-footer">
            <p><strong>Généré le:</strong> ${currentDate}</p>
            <p>Ce document est généré automatiquement par le système de gestion de diplômes blockchain</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new PDFService(); 