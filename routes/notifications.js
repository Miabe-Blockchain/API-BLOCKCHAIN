const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');
const router = express.Router();

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Récupérer les notifications de l'utilisateur
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Numéro de page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Nombre de notifications par page
 *       - in: query
 *         name: unread
 *         schema:
 *           type: boolean
 *         description: Filtrer les notifications non lues
 *     responses:
 *       200:
 *         description: Liste des notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 notifications:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       type:
 *                         type: string
 *                       title:
 *                         type: string
 *                       message:
 *                         type: string
 *                       read:
 *                         type: boolean
 *                       created_at:
 *                         type: string
 *                       data:
 *                         type: object
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalItems:
 *                       type: integer
 *       401:
 *         description: Non autorisé
 *       500:
 *         description: Erreur serveur
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, unread } = req.query;
    const offset = (page - 1) * limit;

    // Pour l'instant, retourner des notifications simulées
    // En production, cela viendrait d'une base de données
    const mockNotifications = [
      {
        id: '1',
        type: 'diploma_created',
        title: 'Nouveau diplôme créé',
        message: 'Le diplôme "Licence en Informatique" a été créé avec succès.',
        read: false,
        created_at: new Date().toISOString(),
        data: { diplomaId: '123', diplomaName: 'Licence en Informatique' }
      },
      {
        id: '2',
        type: 'diploma_registered',
        title: 'Diplôme enregistré sur la blockchain',
        message: 'Le diplôme a été enregistré avec succès sur la blockchain.',
        read: true,
        created_at: new Date(Date.now() - 86400000).toISOString(),
        data: { diplomaId: '123', transactionHash: '0x123...' }
      }
    ];

    // Filtrer par statut de lecture si demandé
    let filteredNotifications = mockNotifications;
    if (unread === 'true') {
      filteredNotifications = mockNotifications.filter(n => !n.read);
    }

    // Pagination
    const totalItems = filteredNotifications.length;
    const totalPages = Math.ceil(totalItems / limit);
    const paginatedNotifications = filteredNotifications.slice(offset, offset + parseInt(limit));

    res.json({
      notifications: paginatedNotifications,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    logger.error('Erreur récupération notifications:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des notifications' });
  }
});

/**
 * @swagger
 * /api/notifications/{id}:
 *   get:
 *     summary: Récupérer une notification spécifique
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la notification
 *     responses:
 *       200:
 *         description: Notification récupérée avec succès
 *       404:
 *         description: Notification non trouvée
 *       500:
 *         description: Erreur serveur
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Simuler une notification (en production, récupérer depuis la base de données)
    const mockNotifications = {
      '1': {
        id: '1',
        type: 'diploma_created',
        title: 'Nouveau diplôme créé',
        message: 'Le diplôme "Licence en Informatique" a été créé avec succès.',
        read: false,
        created_at: new Date().toISOString(),
        data: { diplomaId: '123', diplomaName: 'Licence en Informatique' }
      },
      '2': {
        id: '2',
        type: 'diploma_registered',
        title: 'Diplôme enregistré sur la blockchain',
        message: 'Le diplôme a été enregistré avec succès sur la blockchain.',
        read: true,
        created_at: new Date(Date.now() - 86400000).toISOString(),
        data: { diplomaId: '123', transactionHash: '0x123...' }
      }
    };
    
    const notification = mockNotifications[id];
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification non trouvée' });
    }
    
    res.json(notification);
  } catch (error) {
    logger.error('Erreur récupération notification:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de la notification' });
  }
});

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   put:
 *     summary: Marquer une notification comme lue
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la notification
 *     responses:
 *       200:
 *         description: Notification marquée comme lue
 *       404:
 *         description: Notification non trouvée
 *       500:
 *         description: Erreur serveur
 */
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // En production, mettre à jour la base de données
    logger.info(`Notification ${id} marquée comme lue par l'utilisateur ${req.user.id}`);
    
    res.json({ message: 'Notification marquée comme lue' });
  } catch (error) {
    logger.error('Erreur marquage notification:', error);
    res.status(500).json({ error: 'Erreur lors du marquage de la notification' });
  }
});

/**
 * @swagger
 * /api/notifications/read-all:
 *   post:
 *     summary: Marquer toutes les notifications comme lues
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Toutes les notifications marquées comme lues
 *       500:
 *         description: Erreur serveur
 */
router.post('/read-all', authenticateToken, async (req, res) => {
  try {
    // En production, mettre à jour la base de données
    logger.info(`Toutes les notifications marquées comme lues par l'utilisateur ${req.user.id}`);
    
    res.json({ message: 'Toutes les notifications marquées comme lues' });
  } catch (error) {
    logger.error('Erreur marquage notifications:', error);
    res.status(500).json({ error: 'Erreur lors du marquage des notifications' });
  }
});

module.exports = router; 