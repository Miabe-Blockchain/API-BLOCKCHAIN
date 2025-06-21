const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { User } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Inscription d'un nouvel utilisateur
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - first_name
 *               - last_name
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 example: "Test1234"
 *               first_name:
 *                 type: string
 *                 example: "Jean"
 *               last_name:
 *                 type: string
 *                 example: "Dupont"
 *               role:
 *                 type: string
 *                 enum: [emetteur, verificateur]
 *                 example: "emetteur"
 *               institution_name:
 *                 type: string
 *                 example: "Université Test"
 *               phone:
 *                 type: string
 *                 example: "+33612345678"
 *     responses:
 *       201:
 *         description: Compte créé avec succès
 *       400:
 *         description: Erreur de validation
 *       409:
 *         description: Email déjà utilisé
 *       500:
 *         description: Erreur serveur
 */

// Inscription
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Le mot de passe doit contenir au moins 8 caractères.'),
  body('firstName').trim().isLength({ min: 2, max: 50 }),
  body('lastName').trim().isLength({ min: 2, max: 50 }),
  body('phone')
    .optional({ checkFalsy: true }) // Permet les chaînes vides
    .matches(/^\+?\d{8,15}$/)
    .withMessage('Le numéro doit être au format international, ex: +22892504606')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Formatte les erreurs pour être plus lisibles côté client
      const formattedErrors = errors.array().map(err => ({ field: err.param, message: err.msg }));
      return res.status(400).json({ message: 'Erreur de validation', errors: formattedErrors });
    }

    const { email, password, firstName, lastName, phone } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'Un compte avec cet email existe déjà' });
    }

    // Créer l'utilisateur avec les bons noms de champs
    const user = await User.create({
      email,
      password_hash: password, // Sera hashé automatiquement par le hook
      first_name: firstName,
      last_name: lastName,
      phone,
      role: 'pending', // Rôle par défaut à l'inscription
      status: 'active'
    });

    logger.info(`Nouvel utilisateur créé: ${email}`);

    res.status(201).json({
      message: 'Compte créé avec succès',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    logger.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({ error: 'Erreur lors de la création du compte' });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Connexion utilisateur
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 example: "Test1234"
 *               twoFactorToken:
 *                 type: string
 *                 example: "123456"
 *                 description: Code 2FA si activé
 *     responses:
 *       200:
 *         description: Connexion réussie, retourne un token JWT
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Connexion réussie"
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 user:
 *                   type: object
 *       400:
 *         description: Erreur de validation
 *       401:
 *         description: Email ou mot de passe incorrect, ou code 2FA invalide
 *       500:
 *         description: Erreur serveur
 */

// Connexion
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, twoFactorToken } = req.body;

    // Trouver l'utilisateur
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Vérifier le mot de passe
    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Vérifier le statut du compte
    if (user.status !== 'active') {
      return res.status(401).json({ error: 'Compte désactivé' });
    }

    // Vérification 2FA si activée
    if (user.two_factor_enabled) {
      if (!twoFactorToken) {
        return res.status(200).json({ 
          requiresTwoFactor: true,
          message: 'Code de vérification requis'
        });
      }

      const verified = speakeasy.totp.verify({
        secret: user.two_factor_secret,
        encoding: 'base32',
        token: twoFactorToken,
        window: 2
      });

      if (!verified) {
        return res.status(401).json({ error: 'Code de vérification invalide' });
      }
    }

    // Générer le token JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Mettre à jour la dernière connexion
    await user.update({ last_login: new Date() });

    logger.info(`Utilisateur connecté: ${email}`);

    res.json({
      message: 'Connexion réussie',
      token,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        wallet_address: user.wallet_address,
        institution_name: user.institution_name,
        two_factor_enabled: user.two_factor_enabled
      }
    });
  } catch (error) {
    logger.error('Erreur lors de la connexion:', error);
    res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
});

/**
 * @swagger
 * /api/auth/2fa/setup:
 *   post:
 *     summary: Générer un secret 2FA pour l'utilisateur connecté
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Secret 2FA généré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 secret:
 *                   type: string
 *                 qrCode:
 *                   type: string
 *                 manualEntryKey:
 *                   type: string
 *       400:
 *         description: 2FA déjà activé
 *       500:
 *         description: Erreur lors de la configuration 2FA
 */

// Configuration 2FA - Génération du secret
router.post('/2fa/setup', authenticateToken, async (req, res) => {
  try {
    if (req.user.two_factor_enabled) {
      return res.status(400).json({ error: '2FA déjà activé' });
    }

    const secret = speakeasy.generateSecret({
      name: `Blockchain Diploma (${req.user.email})`,
      issuer: 'Blockchain Diploma API'
    });

    // Sauvegarder temporairement le secret (pas encore activé)
    await req.user.update({ two_factor_secret: secret.base32 });

    // Générer le QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    res.json({
      secret: secret.base32,
      qrCode: qrCodeUrl,
      manualEntryKey: secret.base32
    });
  } catch (error) {
    logger.error('Erreur configuration 2FA:', error);
    res.status(500).json({ error: 'Erreur lors de la configuration 2FA' });
  }
});

/**
 * @swagger
 * /api/auth/2fa/verify:
 *   post:
 *     summary: Activer le 2FA pour l'utilisateur connecté
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: 2FA activé avec succès
 *       400:
 *         description: Erreur de validation ou configuration 2FA non initialisée
 *       401:
 *         description: Code de vérification invalide
 *       500:
 *         description: Erreur lors de l'activation 2FA
 */

// Activation 2FA
router.post('/2fa/verify', authenticateToken, [
  body('token').isLength({ min: 6, max: 6 }).isNumeric()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token } = req.body;

    if (!req.user.two_factor_secret) {
      return res.status(400).json({ error: 'Configuration 2FA non initialisée' });
    }

    const verified = speakeasy.totp.verify({
      secret: req.user.two_factor_secret,
      encoding: 'base32',
      token,
      window: 2
    });

    if (!verified) {
      return res.status(400).json({ error: 'Code invalide' });
    }

    // Activer le 2FA
    await req.user.update({ two_factor_enabled: true });

    logger.info(`2FA activé pour: ${req.user.email}`);

    res.json({ message: '2FA activé avec succès' });
  } catch (error) {
    logger.error('Erreur activation 2FA:', error);
    res.status(500).json({ error: 'Erreur lors de l\'activation 2FA' });
  }
});

// Désactivation 2FA
router.post('/2fa/disable', authenticateToken, [
  body('password').notEmpty(),
  body('token').isLength({ min: 6, max: 6 }).isNumeric()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { password, token } = req.body;

    // Vérifier le mot de passe
    const isValidPassword = await req.user.validatePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Mot de passe incorrect' });
    }

    // Vérifier le token 2FA
    const verified = speakeasy.totp.verify({
      secret: req.user.two_factor_secret,
      encoding: 'base32',
      token,
      window: 2
    });

    if (!verified) {
      return res.status(400).json({ error: 'Code 2FA invalide' });
    }

    // Désactiver le 2FA
    await req.user.update({
      two_factor_enabled: false,
      two_factor_secret: null
    });

    logger.info(`2FA désactivé pour: ${req.user.email}`);

    res.json({ message: '2FA désactivé avec succès' });
  } catch (error) {
    logger.error('Erreur désactivation 2FA:', error);
    res.status(500).json({ error: 'Erreur lors de la désactivation 2FA' });
  }
});

// Vérification du token
router.get('/verify-token', authenticateToken, (req, res) => {
  res.json({
    valid: true,
    user: {
      id: req.user.id,
      email: req.user.email,
      first_name: req.user.first_name,
      last_name: req.user.last_name,
      role: req.user.role,
      wallet_address: req.user.wallet_address,
      institution_name: req.user.institution_name,
      two_factor_enabled: req.user.two_factor_enabled
    }
  });
});

module.exports = router;