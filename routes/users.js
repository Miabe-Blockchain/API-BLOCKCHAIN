const express = require('express');
const { body, validationResult } = require('express-validator');
const { User } = require('../models');
const { authenticateToken, requireRole } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         email:
 *           type: string
 *         first_name:
 *           type: string
 *         last_name:
 *           type: string
 *         role:
 *           type: string
 *         institution_name:
 *           type: string
 *         phone:
 *           type: string
 *         wallet_address:
 *           type: string
 *         status:
 *           type: string
 *         created_at:
 *           type: string
 *           format: date-time
 *   responses:
 *     UserNotFound:
 *       description: Utilisateur non trouvé
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               error:
 *                 type: string
 *                 example: "Utilisateur non trouvé"
 *     UserProfile:
 *       description: Profil utilisateur
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user:
 *                 $ref: '#/components/schemas/User'
 */

// Obtenir le profil utilisateur
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password_hash', 'two_factor_secret', 'email_verification_token'] }
    });

    res.json({ user });
  } catch (error) {
    logger.error('Erreur récupération profil:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du profil' });
  }
});

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Obtenir le profil utilisateur
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         $ref: '#/components/responses/UserProfile'
 *       500:
 *         description: Erreur lors de la récupération du profil
 */

// Mettre à jour le profil
router.put('/profile', authenticateToken, [
  body('first_name').optional().trim().isLength({ min: 2, max: 50 }),
  body('last_name').optional().trim().isLength({ min: 2, max: 50 }),
  body('institution_name').optional().trim().isLength({ max: 100 }),
  body('phone').optional().isMobilePhone()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { first_name, last_name, institution_name, phone } = req.body;

    const updateData = {};
    if (first_name !== undefined) updateData.first_name = first_name;
    if (last_name !== undefined) updateData.last_name = last_name;
    if (institution_name !== undefined) updateData.institution_name = institution_name;
    if (phone !== undefined) updateData.phone = phone;

    await req.user.update(updateData);

    logger.info(`Profil mis à jour: ${req.user.email}`);

    res.json({
      message: 'Profil mis à jour avec succès',
      user: req.user
    });
  } catch (error) {
    logger.error('Erreur mise à jour profil:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du profil' });
  }
});

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Mettre à jour le profil utilisateur
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               institution_name:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profil mis à jour avec succès
 *       400:
 *         description: Erreur de validation
 *       500:
 *         description: Erreur lors de la mise à jour du profil
 */

// Connecter un portefeuille Web3
router.post('/connect-wallet', authenticateToken, [
  body('wallet_address').matches(/^0x[a-fA-F0-9]{40}$/)
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { wallet_address } = req.body;

    // Vérifier si l'adresse n'est pas déjà utilisée
    const existingWallet = await User.findOne({ 
      where: { wallet_address },
      attributes: ['id', 'email']
    });

    if (existingWallet && existingWallet.id !== req.user.id) {
      return res.status(409).json({ 
        error: 'Cette adresse de portefeuille est déjà utilisée par un autre compte' 
      });
    }

    // Mettre à jour l'adresse du portefeuille
    await req.user.update({ wallet_address });

    logger.info(`Portefeuille connecté: ${req.user.email} - ${wallet_address}`);

    res.json({
      message: 'Portefeuille connecté avec succès',
      wallet_address
    });
  } catch (error) {
    logger.error('Erreur connexion portefeuille:', error);
    res.status(500).json({ error: 'Erreur lors de la connexion du portefeuille' });
  }
});

/**
 * @swagger
 * /api/users/connect-wallet:
 *   post:
 *     summary: Connecter un portefeuille Web3
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - wallet_address
 *             properties:
 *               wallet_address:
 *                 type: string
 *                 example: "0x1234...abcd"
 *     responses:
 *       200:
 *         description: Portefeuille connecté avec succès
 *       400:
 *         description: Erreur de validation
 *       409:
 *         description: Adresse déjà utilisée
 *       500:
 *         description: Erreur lors de la connexion du portefeuille
 */

// Déconnecter le portefeuille
router.delete('/disconnect-wallet', authenticateToken, async (req, res) => {
  try {
    await req.user.update({ wallet_address: null });

    logger.info(`Portefeuille déconnecté: ${req.user.email}`);

    res.json({ message: 'Portefeuille déconnecté avec succès' });
  } catch (error) {
    logger.error('Erreur déconnexion portefeuille:', error);
    res.status(500).json({ error: 'Erreur lors de la déconnexion du portefeuille' });
  }
});

/**
 * @swagger
 * /api/users/disconnect-wallet:
 *   delete:
 *     summary: Déconnecter le portefeuille Web3
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Portefeuille déconnecté avec succès
 *       500:
 *         description: Erreur lors de la déconnexion du portefeuille
 */

// Changer le mot de passe
router.put('/change-password', authenticateToken, [
  body('current_password').notEmpty(),
  body('new_password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { current_password, new_password } = req.body;

    // Vérifier le mot de passe actuel
    const isValidPassword = await req.user.validatePassword(current_password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Mot de passe actuel incorrect' });
    }

    // Mettre à jour le mot de passe
    await req.user.update({ password_hash: new_password });

    logger.info(`Mot de passe changé: ${req.user.email}`);

    res.json({ message: 'Mot de passe mis à jour avec succès' });
  } catch (error) {
    logger.error('Erreur changement mot de passe:', error);
    res.status(500).json({ error: 'Erreur lors du changement de mot de passe' });
  }
});

/**
 * @swagger
 * /api/users/change-password:
 *   put:
 *     summary: Changer le mot de passe utilisateur
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - current_password
 *               - new_password
 *             properties:
 *               current_password:
 *                 type: string
 *               new_password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Mot de passe mis à jour avec succès
 *       400:
 *         description: Erreur de validation
 *       401:
 *         description: Mot de passe actuel incorrect
 *       500:
 *         description: Erreur lors du changement de mot de passe
 */

// Lister tous les utilisateurs (admin seulement)
router.get('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10, role, status, search } = req.query;
    const offset = (page - 1) * limit;

    const whereConditions = {};
    if (role) whereConditions.role = role;
    if (status) whereConditions.status = status;

    // Recherche par nom ou email
    if (search) {
      const { Op } = require('sequelize');
      whereConditions[Op.or] = [
        { first_name: { [Op.iLike]: `%${search}%` } },
        { last_name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { institution_name: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows: users } = await User.findAndCountAll({
      where: whereConditions,
      attributes: { exclude: ['password_hash', 'two_factor_secret', 'email_verification_token'] },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalUsers: count,
        hasNext: offset + limit < count,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    logger.error('Erreur liste utilisateurs:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs' });
  }
});

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Lister tous les utilisateurs (admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page de pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Nombre d'utilisateurs par page
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: Filtrer par rôle
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filtrer par statut
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Recherche par nom ou email
 *     responses:
 *       200:
 *         description: Liste paginée des utilisateurs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalUsers:
 *                       type: integer
 *                     hasNext:
 *                       type: boolean
 *                     hasPrev:
 *                       type: boolean
 *       500:
 *         description: Erreur lors de la récupération des utilisateurs
 */

// Modifier le statut d'un utilisateur (admin seulement)
router.put('/:userId/status', authenticateToken, requireRole('admin'), [
  body('status').isIn(['active', 'inactive', 'suspended'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.params;
    const { status } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    await user.update({ status });

    logger.info(`Statut utilisateur modifié: ${user.email} -> ${status}`);

    res.json({
      message: 'Statut utilisateur mis à jour',
      user: { id: user.id, email: user.email, status: user.status }
    });
  } catch (error) {
    logger.error('Erreur modification statut:', error);
    res.status(500).json({ error: 'Erreur lors de la modification du statut' });
  }
});

/**
 * @swagger
 * /api/users/{userId}/status:
 *   put:
 *     summary: Modifier le statut d'un utilisateur (admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'utilisateur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, inactive, suspended]
 *     responses:
 *       200:
 *         description: Statut mis à jour avec succès
 *       400:
 *         description: Erreur de validation
 *       404:
 *         $ref: '#/components/responses/UserNotFound'
 *       500:
 *         description: Erreur lors de la modification du statut
 */

// Modifier le rôle d'un utilisateur (admin seulement)
router.put('/:userId/role', authenticateToken, requireRole('admin'), [
  body('role').isIn(['admin', 'emetteur', 'verificateur', 'pending'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.params;
    const { role } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Empêcher de modifier son propre rôle
    if (user.id === req.user.id) {
      return res.status(400).json({ error: 'Impossible de modifier son propre rôle' });
    }

    await user.update({ role });

    logger.info(`Rôle utilisateur modifié: ${user.email} -> ${role}`);

    res.json({
      message: 'Rôle utilisateur mis à jour',
      user: { id: user.id, email: user.email, role: user.role }
    });
  } catch (error) {
    logger.error('Erreur modification rôle:', error);
    res.status(500).json({ error: 'Erreur lors de la modification du rôle' });
  }
});

module.exports = router;