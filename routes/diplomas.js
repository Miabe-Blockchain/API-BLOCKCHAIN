const express = require('express');
const { body, validationResult, param } = require('express-validator');
const { Diploma, User, Verification } = require('../models');
const { authenticateToken, requireRole, requireWallet } = require('../middleware/auth');
const { blockchainService } = require('../services/blockchainService');
const qrService = require('../services/qrService');
const logger = require('../utils/logger');
const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Diploma:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         hash:
 *           type: string
 *         diploma_name:
 *           type: string
 *         diploma_type:
 *           type: string
 *         issuer_institution:
 *           type: string
 *         emission_date:
 *           type: string
 *           format: date
 *         mention:
 *           type: string
 *         diploma_number:
 *           type: string
 *         student_firstname:
 *           type: string
 *         student_lastname:
 *           type: string
 *         student_birthdate:
 *           type: string
 *           format: date
 *         status:
 *           type: string
 *         qr_code_url:
 *           type: string
 *         verification_url:
 *           type: string
 *         blockchain_tx_hash:
 *           type: string
 *         blockchain_registered_at:
 *           type: string
 *           format: date-time
 *   responses:
 *     DiplomaNotFound:
 *       description: Diplôme non trouvé
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               error:
 *                 type: string
 *                 example: "Diplôme non trouvé"
 *     DiplomaCreated:
 *       description: Diplôme créé avec succès
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Diploma'
 */

// Créer un nouveau diplôme
/**
 * @swagger
 * /api/diplomas:
 *   post:
 *     summary: Créer un nouveau diplôme
 *     tags: [Diplomas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - diploma_name
 *               - diploma_type
 *               - issuer_institution
 *               - emission_date
 *               - mention
 *               - diploma_number
 *               - student_firstname
 *               - student_lastname
 *               - student_birthdate
 *               - student_phone
 *             properties:
 *               diploma_name:
 *                 type: string
 *               diploma_type:
 *                 type: string
 *               issuer_institution:
 *                 type: string
 *               emission_date:
 *                 type: string
 *                 format: date
 *               mention:
 *                 type: string
 *               diploma_number:
 *                 type: string
 *               student_firstname:
 *                 type: string
 *               student_lastname:
 *                 type: string
 *               student_birthdate:
 *                 type: string
 *                 format: date
 *               student_phone:
 *                 type: string
 *     responses:
 *       201:
 *         $ref: '#/components/responses/DiplomaCreated'
 *       400:
 *         description: Erreur de validation
 *       409:
 *         description: Un diplôme identique existe déjà
 *       500:
 *         description: Erreur lors de la création du diplôme
 */
router.post('/', authenticateToken, requireRole('emetteur'), requireWallet, [
  body('diploma_name').trim().isLength({ min: 2, max: 200 }),
  body('diploma_type').isIn([
    'Licence', 'Master', 'Doctorat', 'BTS', 'DUT', 'Certificat',
    'Diplôme d\'ingénieur', 'CAP', 'Baccalauréat', 'Autre'
  ]),
  body('issuer_institution').trim().isLength({ min: 2, max: 200 }),
  body('emission_date').isISO8601().toDate(),
  body('mention').isIn([
    'Passable', 'Assez bien', 'Bien', 'Très bien', 'Excellent', 'Sans mention'
  ]),
  body('diploma_number').trim().isLength({ min: 1, max: 100 }),
  body('student_firstname').trim().isLength({ min: 2, max: 50 }),
  body('student_lastname').trim().isLength({ min: 2, max: 50 }),
  body('student_birthdate').isISO8601().toDate(),
  body('student_phone').isMobilePhone()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const diplomaData = {
      ...req.body,
      issuer_id: req.user.id
    };

    // Générer le hash unique du diplôme
    const hash = qrService.generateDiplomaHash(diplomaData);
    diplomaData.hash = hash;

    // Vérifier l'unicité du hash
    const existingDiploma = await Diploma.findOne({ where: { hash } });
    if (existingDiploma) {
      return res.status(409).json({ error: 'Un diplôme identique existe déjà' });
    }

    // Générer le QR code
    const { qrCodeDataURL, verificationUrl } = await qrService.generateQRCode(hash);
    diplomaData.qr_code_url = qrCodeDataURL;

    // Créer le diplôme en base
    const diploma = await Diploma.create(diplomaData);

    // Estimer les coûts blockchain
    try {
      const gasEstimate = await blockchainService.estimateGasForDiplomaStorage(diplomaData);
      
      logger.info(`Diplôme créé: ${hash} - Coût estimé: ${gasEstimate.estimatedCost} ETH`);
      res.status(201).json({
        message: 'Diplôme créé avec succès',
        diploma: {
          id: diploma.id,
          hash: diploma.hash,
          diploma_name: diploma.diploma_name,
          status: diploma.status,
          qr_code_url: diploma.qr_code_url,
          verification_url: verificationUrl
        },
        blockchain: {
          gasEstimate,
          message: 'Prêt pour l\'enregistrement sur la blockchain'
        }
      });
    } catch (blockchainError) {
      logger.error('Erreur estimation blockchain:', blockchainError);
      res.status(201).json({
        message: 'Diplôme créé avec succès (estimation blockchain indisponible)',
        diploma: {
          id: diploma.id,
          hash: diploma.hash,
          diploma_name: diploma.diploma_name,
          status: diploma.status,
          qr_code_url: diploma.qr_code_url,
          verification_url: verificationUrl
        }
      });
    }
  } catch (error) {
    logger.error('Erreur création diplôme:', error);
    res.status(500).json({ error: 'Erreur lors de la création du diplôme' });
  }
});

// Enregistrer un diplôme sur la blockchain
/**
 * @swagger
 * /api/diplomas/{diplomaId}/register-blockchain:
 *   post:
 *     summary: Enregistrer un diplôme sur la blockchain
 *     tags: [Diplomas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: diplomaId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du diplôme à enregistrer
 *     responses:
 *       200:
 *         description: Diplôme enregistré sur la blockchain
 *       404:
 *         $ref: '#/components/responses/DiplomaNotFound'
 *       409:
 *         description: Ce diplôme est déjà enregistré sur la blockchain
 *       500:
 *         description: Erreur lors de l'enregistrement sur la blockchain
 */
router.post('/:diplomaId/register-blockchain', authenticateToken, requireRole('emetteur'), requireWallet, [
  param('diplomaId').isInt().toInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { diplomaId } = req.params;
    
    // Vérifier que le diplôme existe et appartient à l'utilisateur
    const diploma = await Diploma.findOne({
      where: { 
        id: diplomaId, 
        issuer_id: req.user.id 
      }
    });

    if (!diploma) {
      return res.status(404).json({ error: 'Diplôme non trouvé' });
    }

    if (diploma.status === 'blockchain_registered') {
      return res.status(409).json({ error: 'Ce diplôme est déjà enregistré sur la blockchain' });
    }

    // Enregistrer sur la blockchain
    const blockchainResult = await blockchainService.registerDiploma(diploma);
    
    // Mettre à jour le diplôme en base
    await diploma.update({
      status: 'blockchain_registered',
      blockchain_tx_hash: blockchainResult.transactionHash,
      blockchain_registered_at: new Date()
    });

    logger.info(`Diplôme ${diploma.hash} enregistré sur blockchain: ${blockchainResult.transactionHash}`);

    res.json({
      message: 'Diplôme enregistré avec succès sur la blockchain',
      blockchain: {
        transactionHash: blockchainResult.transactionHash,
        blockNumber: blockchainResult.blockNumber,
        gasUsed: blockchainResult.gasUsed
      }
    });

  } catch (error) {
    logger.error('Erreur enregistrement blockchain:', error);
    res.status(500).json({ error: 'Erreur lors de l\'enregistrement sur la blockchain' });
  }
});

// Récupérer tous les diplômes d'un émetteur
/**
 * @swagger
 * /api/diplomas:
 *   get:
 *     summary: Récupérer tous les diplômes de l'émetteur
 *     tags: [Diplomas]
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
 *         description: Nombre d'éléments par page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filtrer par statut
 *       - in: query
 *         name: diploma_type
 *         schema:
 *           type: string
 *         description: Filtrer par type de diplôme
 *     responses:
 *       200:
 *         description: Liste paginée des diplômes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 diplomas:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Diploma'
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
 *       500:
 *         description: Erreur lors de la récupération des diplômes
 */
router.get('/', authenticateToken, requireRole('emetteur'), async (req, res) => {
  try {
    const { page = 1, limit = 10, status, diploma_type } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { issuer_id: req.user.id };
    if (status) whereClause.status = status;
    if (diploma_type) whereClause.diploma_type = diploma_type;

    const { count, rows: diplomas } = await Diploma.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: offset,
      order: [['created_at', 'DESC']],
      attributes: [
        'id', 'hash', 'diploma_name', 'diploma_type', 'issuer_institution',
        'emission_date', 'mention', 'diploma_number', 'student_firstname',
        'student_lastname', 'student_birthdate', 'status', 'created_at',
        'blockchain_tx_hash', 'blockchain_registered_at'
      ]
    });

    res.json({
      diplomas,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    logger.error('Erreur récupération diplômes:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des diplômes' });
  }
});

// Récupérer un diplôme spécifique
/**
 * @swagger
 * /api/diplomas/{diplomaId}:
 *   get:
 *     summary: Récupérer un diplôme spécifique
 *     tags: [Diplomas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: diplomaId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du diplôme
 *     responses:
 *       200:
 *         description: Diplôme trouvé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Diploma'
 *       404:
 *         $ref: '#/components/responses/DiplomaNotFound'
 *       500:
 *         description: Erreur lors de la récupération du diplôme
 */
router.get('/:diplomaId', authenticateToken, requireRole('emetteur'), [
  param('diplomaId').isInt().toInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { diplomaId } = req.params;
    
    const diploma = await Diploma.findOne({
      where: { 
        id: diplomaId, 
        issuer_id: req.user.id 
      }
    });

    if (!diploma) {
      return res.status(404).json({ error: 'Diplôme non trouvé' });
    }

    res.json({ diploma });

  } catch (error) {
    logger.error('Erreur récupération diplôme:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du diplôme' });
  }
});

// Vérifier un diplôme par hash (endpoint public)
router.get('/verify/:hash', [
  param('hash').isLength({ min: 64, max: 64 }).isAlphanumeric()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { hash } = req.params;

    // Rechercher le diplôme
    const diploma = await Diploma.findOne({
      where: { hash },
      include: [{
        model: User,
        as: 'issuer',
        attributes: ['id', 'firstname', 'lastname', 'email', 'institution']
      }]
    });

    if (!diploma) {
      return res.status(404).json({ 
        verified: false, 
        error: 'Diplôme non trouvé' 
      });
    }

    // Enregistrer la vérification
    await Verification.create({
      diploma_id: diploma.id,
      verified_at: new Date(),
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    // Vérifier sur la blockchain si enregistré
    let blockchainVerification = null;
    if (diploma.status === 'blockchain_registered' && diploma.blockchain_tx_hash) {
      try {
        blockchainVerification = await blockchainService.verifyDiploma(hash, diploma.blockchain_tx_hash);
      } catch (blockchainError) {
        logger.error('Erreur vérification blockchain:', blockchainError);
      }
    }

    res.json({
      verified: true,
      diploma: {
        hash: diploma.hash,
        diploma_name: diploma.diploma_name,
        diploma_type: diploma.diploma_type,
        issuer_institution: diploma.issuer_institution,
        emission_date: diploma.emission_date,
        mention: diploma.mention,
        diploma_number: diploma.diploma_number,
        student_firstname: diploma.student_firstname,
        student_lastname: diploma.student_lastname,
        student_birthdate: diploma.student_birthdate,
        status: diploma.status,
        issuer: diploma.issuer
      },
      blockchain: blockchainVerification,
      verified_at: new Date()
    });

  } catch (error) {
    logger.error('Erreur vérification diplôme:', error);
    res.status(500).json({ error: 'Erreur lors de la vérification du diplôme' });
  }
});

// Supprimer un diplôme (uniquement si non enregistré sur blockchain)
router.delete('/:diplomaId', authenticateToken, requireRole('emetteur'), [
  param('diplomaId').isInt().toInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { diplomaId } = req.params;
    
    const diploma = await Diploma.findOne({
      where: { 
        id: diplomaId, 
        issuer_id: req.user.id 
      }
    });

    if (!diploma) {
      return res.status(404).json({ error: 'Diplôme non trouvé' });
    }

    if (diploma.status === 'blockchain_registered') {
      return res.status(409).json({ 
        error: 'Impossible de supprimer un diplôme enregistré sur la blockchain' 
      });
    }

    await diploma.destroy();

    logger.info(`Diplôme supprimé: ${diploma.hash}`);

    res.json({ message: 'Diplôme supprimé avec succès' });

  } catch (error) {
    logger.error('Erreur suppression diplôme:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du diplôme' });
  }
});

// Obtenir les statistiques des diplômes
router.get('/stats/overview', authenticateToken, requireRole('emetteur'), async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await Diploma.findAll({
      where: { issuer_id: userId },
      attributes: [
        'status',
        [Diploma.sequelize.fn('COUNT', '*'), 'count']
      ],
      group: ['status'],
      raw: true
    });

    const typeStats = await Diploma.findAll({
      where: { issuer_id: userId },
      attributes: [
        'diploma_type',
        [Diploma.sequelize.fn('COUNT', '*'), 'count']
      ],
      group: ['diploma_type'],
      raw: true
    });

    const totalDiplomas = await Diploma.count({
      where: { issuer_id: userId }
    });

    res.json({
      total: totalDiplomas,
      byStatus: stats.reduce((acc, stat) => {
        acc[stat.status] = parseInt(stat.count);
        return acc;
      }, {}),
      byType: typeStats.reduce((acc, stat) => {
        acc[stat.diploma_type] = parseInt(stat.count);
        return acc;
      }, {})
    });

  } catch (error) {
    logger.error('Erreur statistiques diplômes:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
});

module.exports = router;