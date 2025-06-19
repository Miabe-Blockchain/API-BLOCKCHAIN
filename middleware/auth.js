const jwt = require('jsonwebtoken');
const { User } = require('../models');
const logger = require('../utils/logger');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token d\'accès requis' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }

    if (user.status !== 'active') {
      return res.status(401).json({ error: 'Compte désactivé' });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('Erreur d\'authentification:', error);
    return res.status(403).json({ error: 'Token invalide' });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentification requise' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Permissions insuffisantes' });
    }

    next();
  };
};

const requireWallet = (req, res, next) => {
  if (!req.user.wallet_address) {
    return res.status(400).json({ error: 'Portefeuille Web3 requis' });
  }
  next();
};

module.exports = {
  authenticateToken,
  requireRole,
  requireWallet
};