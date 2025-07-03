const express = require('express');
const { body, validationResult, param } = require('express-validator');
const { Diploma, User, Verification } = require('../models');
const { authenticateToken, requireRole, requireWallet } = require('../middleware/auth');
const { blockchainService } = require('../services/blockchainService');
const qrService = require('../services/qrService');
const logger = require('../utils/logger');
const pdfService = require('../services/pdfService');
const notificationService = require('../services/notificationService');
const router = express.Router();
const { Op, sequelize } = require('sequelize');

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

// Obtenir les listes de choix pour les diplômes
/**
 * @swagger
 * /api/diplomas/choices:
 *   get:
 *     summary: Récupérer les listes de choix pour les diplômes
 *     tags: [Diplomas]
 *     responses:
 *       200:
 *         description: Listes de choix disponibles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 diplomaTypes:
 *                   type: array
 *                   items:
 *                     type: string
 *                 mentions:
 *                   type: array
 *                   items:
 *                     type: string
 */
router.get('/choices', (req, res) => {
  res.json({
    diplomaTypes: [
      'Licence',
      'Master', 
      'Doctorat',
      'BTS',
      'DUT',
      'Certificat',
      'Diplôme d\'ingénieur',
      'CAP',
      'Baccalauréat',
      'Autre'
    ],
    mentions: [
      'Passable',
      'Assez bien',
      'Bien',
      'Très bien',
      'Excellent',
      'Sans mention'
    ]
  });
});

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
 *               - studentFirstName
 *               - studentLastName
 *               - diplomaTitle
 *               - issueDate
 *             properties:
 *               studentFirstName:
 *                 type: string
 *               studentLastName:
 *                 type: string
 *               diplomaTitle:
 *                 type: string
 *               issueDate:
 *                 type: string
 *                 format: date
 *               diplomaType:
 *                 type: string
 *                 description: "Type de diplôme (ex: Licence, Master...)"
 *               mention:
 *                 type: string
 *                 description: "Mention obtenue (ex: Bien, Très bien...)"
 *               diplomaNumber:
 *                 type: string
 *                 description: "Numéro ou identifiant unique du diplôme"
 *               studentBirthdate:
 *                 type: string
 *                 format: date
 *                 description: "Date de naissance de l'étudiant"
 *               studentPhone:
 *                 type: string
 *                 description: "Téléphone de l'étudiant"
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
router.post('/', authenticateToken, requireRole(['emetteur', 'admin']), [
  body('studentFirstName').trim().notEmpty().withMessage("Le prénom de l'étudiant est requis."),
  body('studentLastName').trim().notEmpty().withMessage("Le nom de l'étudiant est requis."),
  body('diplomaTitle').trim().notEmpty().withMessage("L'intitulé du diplôme est requis."),
  body('issueDate').isISO8601().toDate().withMessage("La date d'émission est requise au format YYYY-MM-DD."),
  body('diplomaType').isIn(['Licence', 'Master', 'Doctorat', 'BTS', 'DUT', 'Certificat', 'Diplôme d\'ingénieur', 'CAP', 'Baccalauréat', 'Autre']).withMessage("Un type de diplôme valide est requis."),
  body('mention').isIn(['Passable', 'Assez bien', 'Bien', 'Très bien', 'Excellent', 'Sans mention']).withMessage("Une mention valide est requise."),
  body('diplomaNumber').trim().notEmpty().withMessage("Le numéro du diplôme est requis."),
  body('studentBirthdate').isISO8601().toDate().withMessage("La date de naissance de l'étudiant est requise."),
  body('studentPhone').isMobilePhone('any').withMessage("Un numéro de téléphone valide pour l'étudiant est requis.")
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.user.institution_name) {
      return res.status(400).json({ 
        error: "Impossible de créer un diplôme. L'utilisateur émetteur doit d'abord définir le nom de son institution dans son profil." 
      });
    }

    const { studentFirstName, studentLastName, diplomaTitle, issueDate, diplomaType, mention, studentBirthdate, studentPhone, diplomaNumber } = req.body;
    
    const diplomaData = {
      student_firstname: studentFirstName,
      student_lastname: studentLastName,
      diploma_name: diplomaTitle,
      emission_date: issueDate,
      issuer_id: req.user.id,
      issuer_institution: req.user.institution_name,
      diploma_type: diplomaType,
      mention: mention,
      diploma_number: diplomaNumber,
      student_birthdate: studentBirthdate,
      student_phone: studentPhone
    };
    
    const diplomaHash = qrService.generateDiplomaHash(diplomaData);
    diplomaData.hash = diplomaHash;

    const existingDiploma = await Diploma.findOne({ where: { hash: diplomaData.hash } });
    if (existingDiploma) {
      return res.status(409).json({ error: 'Un diplôme identique existe déjà' });
    }

    const { qrCodeDataURL, verificationUrl } = await qrService.generateQRCode(diplomaData.hash);
    diplomaData.qr_code_url = qrCodeDataURL;

    const diploma = await Diploma.create(diplomaData);

    try {
      const gasEstimate = await blockchainService.estimateGasForDiplomaStorage(diplomaData);
      
      logger.info(`Diplôme créé: ${diploma.hash} - Coût estimé: ${gasEstimate.estimatedCost} ETH`);
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

      // Notifier la création du diplôme
      notificationService.notifyDiplomaCreated(diploma, req.user.id);
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
    // Log de l'erreur complète pour le débogage côté serveur
    logger.error('Erreur détaillée lors de la création du diplôme:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      original: error.original // Pour les erreurs Sequelize
    });

    // Envoi d'un message d'erreur plus détaillé au client
    res.status(500).json({ 
      error: 'Erreur serveur lors de la création du diplôme.',
      details: error.message // Message d'erreur exact
    });
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
 *           type: string
 *           format: uuid
 *         description: ID du diplôme à enregistrer
 *     responses:
 *       200:
 *         description: Diplôme enregistré avec succès
 *       404:
 *         $ref: '#/components/responses/DiplomaNotFound'
 *       500:
 *         description: Erreur lors de l'enregistrement
 */
router.post('/:diplomaId/register-blockchain', authenticateToken, requireRole(['admin', 'emetteur']), [
  param('diplomaId').isUUID().withMessage("L'ID du diplôme doit être un UUID valide.")
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { diplomaId } = req.params;
    
    let whereClause = { id: diplomaId };
    // L'émetteur ne peut enregistrer que ses propres diplômes
    if (req.user.role === 'emetteur') {
      whereClause.issuer_id = req.user.id;
    }
    
    const diploma = await Diploma.findOne({ where: whereClause });

    if (!diploma) {
      return res.status(404).json({ error: 'Diplôme non trouvé' });
    }

    if (diploma.blockchain_registered_at) {
      return res.status(409).json({ error: 'Le diplôme est déjà enregistré sur la blockchain' });
    }

    // Enregistrer sur la blockchain
    const blockchainResult = await blockchainService.storeDiplomaOnBlockchain(diploma);

    // Mettre à jour le diplôme
    await diploma.update({
      blockchain_registered_at: new Date(),
      blockchain_transaction_hash: blockchainResult.transactionHash,
      blockchain_block_number: blockchainResult.blockNumber
    });

    // Notifier l'enregistrement
    notificationService.notifyDiplomaRegistered(diploma, req.user.id);

    logger.info(`Diplôme ${diploma.hash} enregistré sur la blockchain par ${req.user.email}`);

    res.json({
      message: 'Diplôme enregistré avec succès sur la blockchain',
      blockchain: {
        transactionHash: blockchainResult.transactionHash,
        blockNumber: blockchainResult.blockNumber,
        gasUsed: blockchainResult.gasUsed,
        status: 'success'
      }
    });

  } catch (error) {
    logger.error('Erreur enregistrement blockchain:', error);
    res.status(500).json({ 
      error: 'Erreur lors de l\'enregistrement sur la blockchain',
      details: error.message
    });
  }
});

// Récupérer tous les diplômes d'un émetteur avec recherche et filtres
/**
 * @swagger
 * /api/diplomas:
 *   get:
 *     summary: Récupérer tous les diplômes avec recherche et filtres
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Recherche dans le nom du diplôme, nom de l'étudiant, ou numéro
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filtrer par statut (blockchain_registered, pending)
 *       - in: query
 *         name: diploma_type
 *         schema:
 *           type: string
 *         description: Filtrer par type de diplôme
 *       - in: query
 *         name: institution
 *         schema:
 *           type: string
 *         description: Filtrer par institution émettrice
 *       - in: query
 *         name: date_from
 *         schema:
 *           type: string
 *           format: date
 *         description: Date de début pour filtrer les diplômes
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           format: date
 *         description: Date de fin pour filtrer les diplômes
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *         description: Trier par (created_at, emission_date, diploma_name, student_name)
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Ordre de tri
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
 *                 filters:
 *                   type: object
 *                   properties:
 *                     applied:
 *                       type: object
 *                     available:
 *                       type: object
 *       500:
 *         description: Erreur lors de la récupération des diplômes
 */
router.get('/', authenticateToken, requireRole(['admin', 'emetteur', 'verificateur']), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      status, 
      diploma_type, 
      institution,
      date_from,
      date_to,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;
    
    const offset = (page - 1) * limit;

    // Construction des conditions de recherche
    let whereClause = {};
    let searchConditions = [];
    
    // L'admin et le verificateur voient tout, l'émetteur ne voit que les siens
    if (req.user.role === 'emetteur') {
        whereClause.issuer_id = req.user.id;
    }
    
    // Filtres de base
    if (status) {
      if (status === 'blockchain_registered') {
        whereClause.blockchain_registered_at = { [Op.ne]: null };
      } else if (status === 'pending') {
        whereClause.blockchain_registered_at = null;
      }
    }
    
    if (diploma_type) whereClause.diploma_type = diploma_type;
    if (institution) whereClause.issuer_institution = { [Op.iLike]: `%${institution}%` };
    
    // Filtres de date
    if (date_from || date_to) {
      whereClause.created_at = {};
      if (date_from) whereClause.created_at[Op.gte] = new Date(date_from);
      if (date_to) whereClause.created_at[Op.lte] = new Date(date_to + ' 23:59:59');
    }
    
    // Recherche textuelle
    if (search) {
      searchConditions.push(
        { diploma_name: { [Op.iLike]: `%${search}%` } },
        { student_firstname: { [Op.iLike]: `%${search}%` } },
        { student_lastname: { [Op.iLike]: `%${search}%` } },
        { diploma_number: { [Op.iLike]: `%${search}%` } }
      );
    }
    
    // Combiner les conditions de recherche
    if (searchConditions.length > 0) {
      whereClause[Op.or] = searchConditions;
    }
    
    // Validation du tri
    const allowedSortFields = ['created_at', 'emission_date', 'diploma_name', 'student_firstname', 'student_lastname'];
    const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';
    const sortDirection = sort_order === 'asc' ? 'ASC' : 'DESC';

    const { count, rows: diplomas } = await Diploma.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: offset,
      order: [[sortField, sortDirection]],
      attributes: [
        'id', 'hash', 'diploma_name', 'diploma_type', 'issuer_institution',
        'emission_date', 'mention', 'diploma_number', 'student_firstname',
        'student_lastname', 'student_birthdate', 'status', 'created_at',
        'blockchain_tx_hash', 'blockchain_registered_at', 'qr_code_url'
      ]
    });

    // Fonction helper pour récupérer les filtres disponibles
    const getAvailableFilters = async (issuerId = null) => {
      try {
        let filterWhereClause = {};
        if (issuerId) {
          filterWhereClause.issuer_id = issuerId;
        }

        const [
          diplomaTypes,
          institutions,
          statuses
        ] = await Promise.all([
          // Types de diplômes disponibles
          Diploma.findAll({
            attributes: [
              [sequelize.fn('DISTINCT', sequelize.col('diploma_type')), 'diploma_type']
            ],
            where: filterWhereClause,
            raw: true
          }),
          
          // Institutions disponibles
          Diploma.findAll({
            attributes: [
              [sequelize.fn('DISTINCT', sequelize.col('issuer_institution')), 'issuer_institution']
            ],
            where: filterWhereClause,
            raw: true
          }),
          
          // Statuts disponibles
          Diploma.findAll({
            attributes: [
              [sequelize.fn('COUNT', sequelize.fn('CASE', {
                when: { blockchain_registered_at: { [Op.ne]: null } },
                then: 1
              })), 'blockchain_registered'],
              [sequelize.fn('COUNT', sequelize.fn('CASE', {
                when: { blockchain_registered_at: null },
                then: 1
              })), 'pending']
            ],
            where: filterWhereClause,
            raw: true
          })
        ]);

        return {
          diploma_types: diplomaTypes.map(item => item.diploma_type).filter(Boolean),
          institutions: institutions.map(item => item.issuer_institution).filter(Boolean),
          statuses: {
            blockchain_registered: parseInt(statuses[0]?.blockchain_registered || 0),
            pending: parseInt(statuses[0]?.pending || 0)
          }
        };
      } catch (error) {
        logger.error('Erreur récupération filtres disponibles:', error);
        return {
          diploma_types: [],
          institutions: [],
          statuses: { blockchain_registered: 0, pending: 0 }
        };
      }
    };

    // Récupérer les filtres disponibles
    const availableFilters = await getAvailableFilters(req.user.role === 'emetteur' ? req.user.id : null);

    res.json({
      diplomas,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      },
      filters: {
        applied: {
          search,
          status,
          diploma_type,
          institution,
          date_from,
          date_to,
          sort_by: sortField,
          sort_order: sortDirection.toLowerCase()
        },
        available: availableFilters
      }
    });
  } catch (error) {
    logger.error('Erreur récupération diplômes:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des diplômes',
      details: error.message
    });
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
 *           type: string
 *           format: uuid
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
router.get('/:diplomaId', authenticateToken, requireRole(['emetteur', 'admin', 'verificateur']), [
  param('diplomaId').isUUID().withMessage("L'ID du diplôme doit être un UUID valide.")
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { diplomaId } = req.params;
    
    let whereClause = { id: diplomaId };
    // L'admin et le verificateur peuvent voir n'importe quel diplôme, l'émetteur seulement les siens
    if (req.user.role === 'emetteur') {
        whereClause.issuer_id = req.user.id;
    }

    const diploma = await Diploma.findOne({
      where: whereClause
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

    await Verification.create({
      diploma_id: diploma.id,
      verified_at: new Date(),
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

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

// Vérification publique d'un diplôme (pour QR codes et hash)
/**
 * @swagger
 * /api/diplomas/verify/{hash}:
 *   get:
 *     summary: Vérifier un diplôme par hash (public)
 *     tags: [Diplomas]
 *     parameters:
 *       - in: path
 *         name: hash
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{64}$'
 *         description: Hash du diplôme à vérifier (64 caractères hexadécimaux)
 *     responses:
 *       200:
 *         description: Informations du diplôme
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isValid:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 diploma:
 *                   $ref: '#/components/schemas/Diploma'
 *                 blockchain:
 *                   type: object
 *                   properties:
 *                     isRegistered:
 *                       type: boolean
 *                     transactionHash:
 *                       type: string
 *                     blockNumber:
 *                       type: number
 *                 verification:
 *                   type: object
 *                   properties:
 *                     verifiedAt:
 *                       type: string
 *                       format: date-time
 *                     ipAddress:
 *                       type: string
 *       404:
 *         description: Diplôme non trouvé
 *       400:
 *         description: Hash invalide
 *       500:
 *         description: Erreur serveur
 */
router.get('/verify/:hash', [
  param('hash')
    .isLength({ min: 64, max: 64 })
    .withMessage('Le hash doit faire exactement 64 caractères')
    .matches(/^[a-fA-F0-9]{64}$/)
    .withMessage('Le hash doit contenir uniquement des caractères hexadécimaux (0-9, a-f, A-F)')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        isValid: false,
        error: 'Hash invalide',
        details: errors.array()
      });
    }

    const { hash } = req.params;
    
    // Rechercher le diplôme avec les informations de l'émetteur
    const diploma = await Diploma.findOne({
      where: { hash: hash },
      include: [{
        model: User,
        as: 'issuer',
        attributes: ['id', 'first_name', 'last_name', 'email', 'institution_name']
      }]
    });

    if (!diploma) {
      return res.status(404).json({ 
        isValid: false,
        message: 'Diplôme non trouvé',
        hash: hash,
        verifiedAt: new Date()
      });
    }

    // Vérification blockchain
    let blockchainVerification = null;
    if (diploma.blockchain_registered_at && diploma.blockchain_tx_hash) {
      try {
        const blockchainResult = await blockchainService.verifyDiplomaOnBlockchain(hash);
        blockchainVerification = {
          isRegistered: blockchainResult.isValid,
          transactionHash: diploma.blockchain_tx_hash,
          blockNumber: null, // Peut être ajouté si nécessaire
          verifiedAt: new Date()
        };
      } catch (blockchainError) {
        logger.error('Erreur vérification blockchain:', blockchainError);
        blockchainVerification = {
          isRegistered: false,
          error: 'Erreur lors de la vérification blockchain'
        };
      }
    }

    // Enregistrer la vérification (sans authentification)
    try {
      await Verification.create({
        diploma_id: diploma.id,
        verifier_id: null, // Vérification publique
        verification_result: 'valid',
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        verification_notes: 'Vérification publique'
      });
    } catch (verificationError) {
      logger.error('Erreur enregistrement vérification:', verificationError);
      // Ne pas faire échouer la requête pour une erreur de log
    }

    // Réponse avec toutes les informations
    res.json({
      isValid: true,
      message: 'Diplôme authentique',
      diploma: {
        id: diploma.id,
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
        student_phone: diploma.student_phone,
        status: diploma.status,
        blockchain_registered_at: diploma.blockchain_registered_at,
        blockchain_transaction_hash: diploma.blockchain_tx_hash,
        created_at: diploma.created_at,
        issuer: diploma.issuer ? {
          name: `${diploma.issuer.first_name} ${diploma.issuer.last_name}`,
          email: diploma.issuer.email,
          institution: diploma.issuer.institution_name
        } : null
      },
      blockchain: blockchainVerification,
      verification: {
        verifiedAt: new Date(),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

  } catch (error) {
    logger.error('Erreur vérification publique:', error);
    res.status(500).json({ 
      isValid: false,
      error: 'Erreur lors de la vérification',
      details: error.message
    });
  }
});

// Supprimer un diplôme (uniquement si non enregistré sur blockchain)
router.delete('/:diplomaId', authenticateToken, requireRole(['emetteur']), [
  param('diplomaId').isUUID().withMessage("L'ID du diplôme doit être un UUID valide.")
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
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est authentifié
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Utilisateur non authentifié' });
    }

    const whereClause = {};
    
    // L'émetteur ne voit que ses propres statistiques
    if (req.user.role === 'emetteur') {
      whereClause.issuer_id = req.user.id;
    }

    // Récupérer les statistiques de base avec gestion d'erreur
    let totalDiplomas = 0;
    let registeredDiplomas = 0;
    let pendingDiplomas = 0;

    try {
      [totalDiplomas, registeredDiplomas, pendingDiplomas] = await Promise.all([
        Diploma.count({ where: whereClause }),
        Diploma.count({ where: { ...whereClause, blockchain_registered_at: { [Op.ne]: null } } }),
        Diploma.count({ where: { ...whereClause, blockchain_registered_at: null } })
      ]);
    } catch (countError) {
      logger.warn('Erreur lors du comptage des diplômes:', countError);
      // Continuer avec des valeurs par défaut
    }

    // Récupérer tous les diplômes pour les statistiques détaillées
    let allDiplomas = [];
    try {
      allDiplomas = await Diploma.findAll({
        where: whereClause,
        attributes: ['diploma_type', 'emission_date', 'issuer_institution'],
        raw: true
      });
    } catch (findError) {
      logger.warn('Erreur lors de la récupération des diplômes:', findError);
      // Continuer avec une liste vide
    }

    // Statistiques par type
    const typeCount = {};
    allDiplomas.forEach(diploma => {
      const type = diploma.diploma_type || 'Non spécifié';
      typeCount[type] = (typeCount[type] || 0) + 1;
    });
    
    const diplomasByType = Object.entries(typeCount).map(([type, count]) => ({
      diploma_type: type,
      count: count
    }));

    // Statistiques par année
    const yearCount = {};
    allDiplomas.forEach(diploma => {
      if (diploma.emission_date) {
        const year = new Date(diploma.emission_date).getFullYear();
        yearCount[year] = (yearCount[year] || 0) + 1;
      }
    });
    
    const diplomasByYear = Object.entries(yearCount)
      .map(([year, count]) => ({ year: parseInt(year), count }))
      .sort((a, b) => b.year - a.year);

    // Statistiques par institution
    const institutionCount = {};
    allDiplomas.forEach(diploma => {
      const institution = diploma.issuer_institution || 'Non spécifié';
      institutionCount[institution] = (institutionCount[institution] || 0) + 1;
    });
    
    const diplomasByInstitution = Object.entries(institutionCount)
      .map(([institution, count]) => ({ issuer_institution: institution, count }))
      .sort((a, b) => b.count - a.count);

    res.json({
      total: totalDiplomas,
      registered: registeredDiplomas,
      pending: pendingDiplomas,
      byType: diplomasByType,
      byYear: diplomasByYear,
      byInstitution: diplomasByInstitution
    });
  } catch (error) {
    logger.error('Erreur récupération statistiques:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
});

// Générer PDF d'un diplôme
/**
 * @swagger
 * /api/diplomas/{diplomaId}/pdf:
 *   get:
 *     summary: Générer un PDF d'un diplôme
 *     tags: [Diplomas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: diplomaId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID du diplôme
 *       - in: query
 *         name: preview
 *         schema:
 *           type: boolean
 *         description: Mode prévisualisation
 *     responses:
 *       200:
 *         description: PDF généré avec succès
 *       404:
 *         $ref: '#/components/responses/DiplomaNotFound'
 *       500:
 *         description: Erreur lors de la génération du PDF
 */
router.get('/:diplomaId/pdf', authenticateToken, [
  param('diplomaId').isUUID().withMessage("L'ID du diplôme doit être un UUID valide.")
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { diplomaId } = req.params;
    const { preview } = req.query;
    
    let whereClause = { id: diplomaId };
    // L'émetteur ne peut voir que ses propres diplômes
    if (req.user.role === 'emetteur') {
      whereClause.issuer_id = req.user.id;
    }
    
    const diploma = await Diploma.findOne({ where: whereClause });

    if (!diploma) {
      return res.status(404).json({ error: 'Diplôme non trouvé' });
    }

    // Générer le PDF
    const pdfBuffer = await pdfService.generateDiplomaPDF(diploma);
    
    if (preview === 'true') {
      // Mode prévisualisation
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Length', pdfBuffer.length);
      res.send(pdfBuffer);
    } else {
      // Mode téléchargement
      const filename = `diploma-${diploma.student_firstname}-${diploma.student_lastname}-${diploma.diploma_number}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.send(pdfBuffer);
    }

  } catch (error) {
    logger.error('Erreur génération PDF:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la génération du PDF',
      details: error.message
    });
  }
});

module.exports = router;