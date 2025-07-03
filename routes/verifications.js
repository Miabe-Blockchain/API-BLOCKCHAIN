const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { Diploma, Verification, User } = require('../models');
const logger = require('../utils/logger');
const router = express.Router();
const { Op } = require('sequelize');

/**
 * @swagger
 * /api/verifications:
 *   get:
 *     summary: Récupérer l'historique des vérifications
 *     tags: [Verifications]
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
 *         description: Nombre de vérifications par page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [valid, invalid, pending]
 *         description: Filtrer par statut
 *       - in: query
 *         name: date_from
 *         schema:
 *           type: string
 *           format: date
 *         description: Date de début
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           format: date
 *         description: Date de fin
 *     responses:
 *       200:
 *         description: Liste des vérifications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 verifications:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       diploma_hash:
 *                         type: string
 *                       status:
 *                         type: string
 *                       verified_at:
 *                         type: string
 *                       verifier_id:
 *                         type: string
 *                       notes:
 *                         type: string
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
    const { page = 1, limit = 20, status, date_from, date_to } = req.query;
    const offset = (page - 1) * limit;

    const whereConditions = {};
    
    if (status) {
      whereConditions.verification_result = status;
    }
    
    if (date_from || date_to) {
      whereConditions.verified_at = {};
      if (date_from) {
        whereConditions.verified_at[Op.gte] = new Date(date_from);
      }
      if (date_to) {
        whereConditions.verified_at[Op.lte] = new Date(date_to);
      }
    }

    const { count, rows: verifications } = await Verification.findAndCountAll({
      where: whereConditions,
      order: [['verified_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      verifications,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    logger.error('Erreur récupération vérifications:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des vérifications' });
  }
});

/**
 * @swagger
 * /api/verifications/{hash}:
 *   get:
 *     summary: Vérifier un diplôme par son hash
 *     tags: [Verifications]
 *     parameters:
 *       - in: path
 *         name: hash
 *         required: true
 *         schema:
 *           type: string
 *         description: Hash du diplôme à vérifier
 *     responses:
 *       200:
 *         description: Résultat de la vérification
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                 diploma:
 *                   type: object
 *                 verification:
 *                   type: object
 *       404:
 *         description: Diplôme non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.get('/:hash', async (req, res) => {
  try {
    const { hash } = req.params;

    const diploma = await Diploma.findOne({
      where: { hash },
      include: [
        {
          model: User,
          as: 'issuer',
          attributes: ['first_name', 'last_name', 'institution_name']
        }
      ]
    });

    if (!diploma) {
      return res.status(404).json({ error: 'Diplôme non trouvé' });
    }

    // Créer une vérification
    const verification = await Verification.create({
      diploma_hash: hash,
      status: 'valid',
      verified_at: new Date(),
      verifier_id: req.user?.id || null,
      notes: 'Vérification publique'
    });

    res.json({
      valid: true,
      diploma: {
        id: diploma.id,
        hash: diploma.hash,
        diploma_name: diploma.diploma_name,
        diploma_type: diploma.diploma_type,
        issuer_institution: diploma.issuer_institution,
        emission_date: diploma.emission_date,
        student_firstname: diploma.student_firstname,
        student_lastname: diploma.student_lastname,
        blockchain_registered_at: diploma.blockchain_registered_at,
        blockchain_transaction_hash: diploma.blockchain_transaction_hash
      },
      verification: {
        id: verification.id,
        verified_at: verification.verified_at,
        status: verification.status
      }
    });
  } catch (error) {
    logger.error('Erreur vérification diplôme:', error);
    res.status(500).json({ error: 'Erreur lors de la vérification du diplôme' });
  }
});

/**
 * @swagger
 * /api/verifications:
 *   post:
 *     summary: Créer une nouvelle vérification
 *     tags: [Verifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - diploma_hash
 *               - status
 *             properties:
 *               diploma_hash:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [valid, invalid, pending]
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Vérification créée
 *       400:
 *         description: Erreur de validation
 *       500:
 *         description: Erreur serveur
 */
router.post('/', authenticateToken, requireRole(['verificateur', 'admin']), async (req, res) => {
  try {
    const { diploma_hash, status, notes } = req.body;

    if (!diploma_hash) {
      return res.status(400).json({ error: 'Hash du diplôme requis' });
    }

    // Vérifier que le diplôme existe
    const diploma = await Diploma.findOne({ where: { hash: diploma_hash } });
    if (!diploma) {
      return res.status(404).json({ error: 'Diplôme non trouvé' });
    }

    const verification = await Verification.create({
      diploma_hash,
      status: status || 'valid',
      verified_at: new Date(),
      verifier_id: req.user.id,
      notes: notes || ''
    });

    logger.info(`Vérification créée: ${verification.id} pour le diplôme ${diploma_hash}`);

    res.status(201).json({
      message: 'Vérification créée avec succès',
      verification: {
        id: verification.id,
        status: verification.status,
        verified_at: verification.verified_at
      }
    });
  } catch (error) {
    logger.error('Erreur création vérification:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la vérification' });
  }
});

module.exports = router; 