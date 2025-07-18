// routes/admin.js
const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { User, Diploma, Verification, BlockchainTransaction } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const router = express.Router();

// Middleware : admin uniquement
router.use(authenticateToken, requireRole('admin'));

/**
 * @swagger
 * components:
 *   schemas:
 *     AdminStats:
 *       type: object
 *       properties:
 *         users:
 *           type: integer
 *           description: Nombre total d'utilisateurs
 *           example: 150
 *         diplomas:
 *           type: integer
 *           description: Nombre total de diplômes
 *           example: 1250
 *         verifications:
 *           type: integer
 *           description: Nombre total de vérifications
 *           example: 3400
 *         transactions:
 *           type: integer
 *           description: Nombre total de transactions blockchain
 *           example: 890
 *     
 *     UserActivationResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "Utilisateur john.doe@example.com activé avec succès."
 *     
 *     RoleUpdateRequest:
 *       type: object
 *       required:
 *         - role
 *       properties:
 *         role:
 *           type: string
 *           enum: [admin, emetteur, verificateur]
 *           description: Nouveau rôle à assigner
 *           example: "emetteur"
 *     
 *     RoleUpdateResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "Rôle mis à jour pour john.doe@example.com"
 *     
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Description de l'erreur
 *           example: "Erreur lors de la récupération des statistiques"
 *         details:
 *           type: array
 *           items:
 *             type: object
 *           description: Détails supplémentaires sur l'erreur (optionnel)
 *   
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: Token JWT pour l'authentification
 *   
 *   responses:
 *     UnauthorizedError:
 *       description: Token d'authentification manquant ou invalide
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *           example:
 *             error: "Token d'accès requis"
 *     
 *     ForbiddenError:
 *       description: Permissions insuffisantes
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *           example:
 *             error: "Permissions insuffisantes - Rôle admin requis"
 *     
 *     ValidationError:
 *       description: Erreur de validation des données
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               errors:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     field:
 *                       type: string
 *                     message:
 *                       type: string
 *           example:
 *             errors:
 *               - field: "role"
 *                 message: "Le rôle doit être l'un des suivants: admin, emetteur, verificateur"
 *     
 *     NotFoundError:
 *       description: Ressource non trouvée
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *           example:
 *             error: "Utilisateur introuvable"
 *     
 *     InternalServerError:
 *       description: Erreur interne du serveur
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *           example:
 *             error: "Erreur interne du serveur"
 */

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Récupérer les statistiques globales du système
 *     description: Obtient un résumé des statistiques principales du système (utilisateurs, diplômes, vérifications, transactions)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques récupérées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminStats'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/stats', async (req, res) => {
  try {
    const [usersCount, diplomasCount, verificationsCount, transactionsCount] = await Promise.all([
      User.count(),
      Diploma.count(),
      Verification.count(),
      BlockchainTransaction.count()
    ]);

    const stats = {
      users: usersCount,
      diplomas: diplomasCount,
      verifications: verificationsCount,
      transactions: transactionsCount
    };

    logger.info('Statistiques admin récupérées', { 
      adminId: req.user.id, 
      stats 
    });

    res.json(stats);
  } catch (error) {
    logger.error('Erreur récupération statistiques admin:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des statistiques' 
    });
  }
});

/**
 * @swagger
 * /api/admin/activate-user/{userId}:
 *   post:
 *     summary: Activer un compte utilisateur
 *     description: Active un compte utilisateur après vérification d'email ou validation manuelle
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de l'utilisateur à activer
 *     responses:
 *       200:
 *         description: Utilisateur activé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserActivationResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/activate-user/:userId', [
  param('userId')
    .isUUID()
    .withMessage('L\'ID utilisateur doit être un UUID valide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.params;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    if (user.status === 'active') {
      return res.status(409).json({ error: 'L\'utilisateur est déjà actif' });
    }

    await user.update({ status: 'active' });

    logger.info('Utilisateur activé par admin', { 
      adminId: req.user.id, 
      userId: user.id,
      userEmail: user.email 
    });

    res.json({ 
      message: `Utilisateur ${user.email} activé avec succès.` 
    });
  } catch (error) {
    logger.error('Erreur activation utilisateur:', error);
    res.status(500).json({ 
      error: 'Erreur lors de l\'activation du compte' 
    });
  }
});

/**
 * @swagger
 * /api/admin/update-role/{userId}:
 *   post:
 *     summary: Modifier le rôle d'un utilisateur
 *     description: "Met à jour le rôle d'un utilisateur (ex: passer de pending à emetteur)"
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: ID unique de l'utilisateur
 *         schema:
 *           type: string
 *           format: uuid
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RoleUpdateRequest'
 *     responses:
 *       200:
 *         description: Rôle mis à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RoleUpdateResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/update-role/:userId', [
  param('userId')
    .isUUID()
    .withMessage('L\'ID utilisateur doit être un UUID valide'),
  body('role')
    .isIn(['admin', 'emetteur', 'verificateur'])
    .withMessage('Le rôle doit être l\'un des suivants: admin, emetteur, verificateur')
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
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    if (user.role === role) {
      return res.status(409).json({ 
        error: `L'utilisateur a déjà le rôle ${role}` 
      });
    }

    // Empêcher la modification du rôle du dernier admin
    if (user.role === 'admin' && role !== 'admin') {
      const adminCount = await User.count({ where: { role: 'admin' } });
      if (adminCount <= 1) {
        return res.status(409).json({ 
          error: 'Impossible de modifier le rôle du dernier administrateur' 
        });
      }
    }

    const oldRole = user.role;
    await user.update({ role });

    logger.info('Rôle utilisateur mis à jour par admin', { 
      adminId: req.user.id, 
      userId: user.id,
      userEmail: user.email,
      oldRole,
      newRole: role
    });

    res.json({ 
      message: `Rôle mis à jour pour ${user.email}` 
    });
  } catch (error) {
    logger.error('Erreur mise à jour rôle:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la mise à jour du rôle' 
    });
  }
});

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Récupérer la liste des utilisateurs
 *     description: Obtient la liste paginée des utilisateurs avec possibilité de filtrage
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Numéro de page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Nombre d'éléments par page
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, emetteur, verificateur, pending]
 *         description: Filtrer par rôle
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, pending]
 *         description: Filtrer par statut
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Recherche par nom, prénom ou email
 *     responses:
 *       200:
 *         description: Liste des utilisateurs récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       firstname:
 *                         type: string
 *                       lastname:
 *                         type: string
 *                       email:
 *                         type: string
 *                       role:
 *                         type: string
 *                       status:
 *                         type: string
 *                       institution:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalItems:
 *                       type: integer
 *                     itemsPerPage:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/users', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const users = await User.findAll({
            order: [['created_at', 'DESC']],
            attributes: { exclude: ['password_hash', 'two_factor_secret', 'email_verification_token'] }
        });
        res.json(users);
    } catch (error) {
        logger.error('Erreur récupération utilisateurs admin:', error);
        res.status(500).json({ 
            error: 'Erreur lors de la récupération des utilisateurs' 
        });
    }
});

/**
 * @swagger
 * /api/admin/users/{userId}/suspend:
 *   post:
 *     summary: Suspendre un utilisateur
 *     description: Suspend temporairement un compte utilisateur
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: ID unique de l'utilisateur à suspendre
 *         schema:
 *           type: string
 *           format: uuid
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Raison de la suspension
 *                 example: "Violation des conditions d'utilisation"
 *     responses:
 *       200:
 *         description: Utilisateur suspendu avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Utilisateur john.doe@example.com suspendu avec succès"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/users/:userId/suspend', [
  param('userId')
    .isUUID()
    .withMessage('L\'ID utilisateur doit être un UUID valide'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('La raison ne doit pas dépasser 500 caractères')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.params;
    const { reason } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ 
        error: 'Impossible de suspendre un administrateur' 
      });
    }

    if (user.status === 'suspended') {
      return res.status(409).json({ 
        error: 'L\'utilisateur est déjà suspendu' 
      });
    }

    await user.update({ 
      status: 'suspended',
      suspension_reason: reason,
      suspended_at: new Date(),
      suspended_by: req.user.id
    });

    logger.info('Utilisateur suspendu par admin', { 
      adminId: req.user.id, 
      userId: user.id,
      userEmail: user.email,
      reason
    });

    res.json({ 
      message: `Utilisateur ${user.email} suspendu avec succès` 
    });
  } catch (error) {
    logger.error('Erreur suspension utilisateur:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la suspension de l\'utilisateur' 
    });
  }
});

/**
 * @swagger
 * /api/admin/roles:
 *   get:
 *     summary: Récupérer la liste des rôles disponibles
 *     description: Obtient la liste des rôles système disponibles pour l'assignation aux utilisateurs
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des rôles récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 roles:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                   example: [{"id": "admin", "name": "Administrateur"}, {"id": "emetteur", "name": "Émetteur"}, {"id": "verificateur", "name": "Vérificateur"}]
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/roles', async (req, res) => {
  try {
    const roles = [
      { id: 'admin', name: 'Administrateur' },
      { id: 'emetteur', name: 'Émetteur' },
      { id: 'verificateur', name: 'Vérificateur' }
    ];
    
    logger.info('Rôles récupérés par admin', { adminId: req.user.id });
    
    res.json({ roles });
  } catch (error) {
    logger.error('Erreur récupération rôles:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des rôles' 
    });
  }
});

/**
 * @swagger
 * /api/admin/logs:
 *   get:
 *     summary: Récupérer les logs système
 *     description: Obtient les logs système pour le débogage et la surveillance
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [error, warn, info, debug]
 *         description: Niveau de log à filtrer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Nombre maximum de logs à retourner
 *     responses:
 *       200:
 *         description: Logs récupérés avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 logs:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       timestamp:
 *                         type: string
 *                       level:
 *                         type: string
 *                       message:
 *                         type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/logs', async (req, res) => {
  try {
    const { level, limit = 100 } = req.query;
    
    // Simuler des logs (dans un vrai système, vous utiliseriez un service de logging)
    const logs = [
      {
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'Système démarré avec succès'
      },
      {
        timestamp: new Date(Date.now() - 60000).toISOString(),
        level: 'info',
        message: 'Nouvelle connexion utilisateur'
      }
    ];
    
    logger.info('Logs récupérés par admin', { adminId: req.user.id, level, limit });
    
    res.json({ logs: logs.slice(0, parseInt(limit)) });
  } catch (error) {
    logger.error('Erreur récupération logs:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des logs' 
    });
  }
});

/**
 * @swagger
 * /api/admin/analytics:
 *   get:
 *     summary: Récupérer les analytics avancés
 *     description: Obtient des statistiques avancées et des métriques pour l'analyse
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month, year]
 *           default: month
 *         description: Période d'analyse
 *     responses:
 *       200:
 *         description: Analytics récupérés avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 period:
 *                   type: string
 *                 metrics:
 *                   type: object
 *                   properties:
 *                     newUsers:
 *                       type: integer
 *                     newDiplomas:
 *                       type: integer
 *                     verifications:
 *                       type: integer
 *                     blockchainTransactions:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/analytics', async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    // Récupérer les statistiques de base (sans filtrage par date pour l'instant)
    const [newUsers, newDiplomas, verifications, blockchainTransactions] = await Promise.all([
      User.count(),
      Diploma.count(),
      Verification.count(),
      BlockchainTransaction.count()
    ]);
    
    const analytics = {
      period,
      metrics: {
        newUsers,
        newDiplomas,
        verifications,
        blockchainTransactions
      }
    };
    
    logger.info('Analytics récupérés par admin', { 
      adminId: req.user.id, 
      period,
      analytics 
    });
    
    res.json(analytics);
  } catch (error) {
    logger.error('Erreur récupération analytics:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des analytics' 
    });
  }
});

module.exports = router;
