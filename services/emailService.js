// services/emailService.js
const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false, // true si port 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

module.exports = {
  /**
   * Envoie un e-mail de vérification
   * @param {string} to - adresse e-mail du destinataire
   * @param {string} token - jeton de vérification
   */
  async sendVerificationEmail(to, token) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    const mailOptions = {
      from: process.env.FROM_EMAIL || '"Blockchain Diplôme" <no-reply@example.com>',
      to,
      subject: 'Vérification de votre adresse e-mail',
      html: `
        <p>Bonjour,</p>
        <p>Merci de vous être inscrit. Pour activer votre compte, veuillez cliquer sur le lien ci-dessous :</p>
        <p><a href="${verificationUrl}">${verificationUrl}</a></p>
        <p>Si vous n'avez pas créé de compte, ignorez ce message.</p>
        <br/>
        <p>-- L'équipe Blockchain Diplôme</p>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      logger.info(`Email de vérification envoyé à ${to}`);
    } catch (err) {
      logger.error(`Erreur envoi email à ${to} :`, err);
      throw new Error('Erreur lors de l’envoi de l’e-mail de vérification');
    }
  }
};
