// routes/blockchain.js
const express = require('express');
const { authenticateToken, requireWallet } = require('../middleware/auth');
const { blockchainService } = require('../services/blockchainService');
const { Diploma } = require('../models');
const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     BlockchainTransaction:
 *       type: object
 *       properties:
 *         hash:
 *           type: string
 *         blockNumber:
 *           type: integer
 *         from:
 *           type: string
 *         to:
 *           type: string
 *         value:
 *           type: string
 *         gasUsed:
 *           type: integer
 *         status:
 *           type: string
 *   responses:
 *     TransactionNotFound:
 *       description: Transaction non trouvée
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               error:
 *                 type: string
 *                 example: "Transaction non trouvée"
 */

/**
 * @route GET /blockchain/transaction/:txHash
 * @desc Récupérer les détails d'une transaction blockchain
 * @access Authentifié
 */
router.get('/transaction/:txHash', authenticateToken, async (req, res) => {
  const { txHash } = req.params;

  try {
    const tx = await blockchainService.getTransactionDetails(txHash);
    res.json(tx);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération de la transaction' });
  }
});

/**
 * @swagger
 * /api/blockchain/transaction/{txHash}:
 *   get:
 *     summary: Récupérer les détails d'une transaction blockchain
 *     tags: [Blockchain]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: txHash
 *         required: true
 *         schema:
 *           type: string
 *         description: Hash de la transaction
 *     responses:
 *       200:
 *         description: Détails de la transaction
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BlockchainTransaction'
 *       404:
 *         $ref: '#/components/responses/TransactionNotFound'
 *       500:
 *         description: Erreur lors de la récupération de la transaction
 */

/**
 * @route POST /blockchain/verify
 * @desc Vérifier un diplôme sur la blockchain
 * @access Authentifié avec wallet
 */
router.post('/verify', authenticateToken, requireWallet, async (req, res) => {
  const { hash } = req.body;

  if (!hash) {
    return res.status(400).json({ error: 'Hash du diplôme requis' });
  }

  try {
    const result = await blockchainService.verifyDiplomaOnBlockchain(hash, req.user.wallet_address);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la vérification sur la blockchain' });
  }
});

/**
 * @swagger
 * /api/blockchain/verify:
 *   post:
 *     summary: Vérifier un diplôme sur la blockchain
 *     tags: [Blockchain]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - hash
 *             properties:
 *               hash:
 *                 type: string
 *     responses:
 *       200:
 *         description: Résultat de la vérification
 *       400:
 *         description: Hash du diplôme requis
 *       500:
 *         description: Erreur lors de la vérification sur la blockchain
 */

/**
 * @route POST /blockchain/estimate-gas
 * @desc Estimer le coût (gas) de stockage d'un diplôme
 * @access Authentifié
 */
router.post('/estimate-gas', authenticateToken, async (req, res) => {
  try {
    const diplomaData = req.body;
    const estimate = await blockchainService.estimateGasForDiplomaStorage(diplomaData);
    res.json(estimate);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de l\'estimation du gas' });
  }
});

/**
 * @swagger
 * /api/blockchain/estimate-gas:
 *   post:
 *     summary: Estimer le coût (gas) de stockage d'un diplôme
 *     tags: [Blockchain]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Estimation du coût de stockage
 *       500:
 *         description: Erreur lors de l'estimation du gas
 */

module.exports = router;
