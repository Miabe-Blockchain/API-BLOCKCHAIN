const QRCode = require('qrcode');
const crypto = require('crypto');

class QRService {
  generateDiplomaHash(diplomaData) {
    const dataString = [
      diplomaData.diploma_name,
      diplomaData.diploma_type,
      diplomaData.issuer_institution,
      new Date(diplomaData.emission_date).toISOString(),
      diplomaData.mention,
      diplomaData.diploma_number,
      diplomaData.student_firstname,
      diplomaData.student_lastname,
      new Date(diplomaData.student_birthdate).toISOString(),
      diplomaData.student_phone,
      diplomaData.issuer_id
    ].join('|');

    return crypto.createHash('sha256').update(dataString).digest('hex');
  }

  async generateQRCode(hash) {
    try {
      // URL de vérification publique
      const verificationUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/diplomas/verify/${hash}`;
      const qrCodeDataURL = await QRCode.toDataURL(verificationUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      return {
        qrCodeDataURL,
        verificationUrl
      };
    } catch (error) {
      throw new Error('Erreur génération QR code: ' + error.message);
    }
  }
}

module.exports = new QRService();