const QRCode = require('qrcode');
const crypto = require('crypto');

class QRService {
  generateDiplomaHash(diplomaData) {
    const dataString = [
      diplomaData.diploma_name,
      diplomaData.diploma_type,
      diplomaData.issuer_institution,
      diplomaData.emission_date,
      diplomaData.mention,
      diplomaData.diploma_number,
      diplomaData.student_firstname,
      diplomaData.student_lastname,
      diplomaData.student_birthdate,
      diplomaData.student_phone,
      diplomaData.issuer_id,
      Date.now().toString()
    ].join('|');

    return crypto.createHash('sha256').update(dataString).digest('hex');
  }

  async generateQRCode(hash) {
    try {
      const verificationUrl = `${process.env.FRONTEND_URL}/verify/${hash}`;
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