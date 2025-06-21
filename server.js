const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const diplomaRoutes = require('./routes/diplomas');
const blockchainRoutes = require('./routes/blockchain');
const adminRoutes = require('./routes/admin');

const { sequelize } = require('./models');
const { initializeBlockchain } = require('./services/blockchainService');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration CORS pour autoriser le frontend Next.js
const corsOptions = {
  origin: 'http://localhost:3001',
  optionsSuccessStatus: 200 // Pour les navigateurs plus anciens
};
app.use(cors(corsOptions));

// Middleware de sécurité
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limite de 100 requêtes par IP
  message: 'Trop de requêtes depuis cette IP, réessayez plus tard.'
});
app.use(limiter);

// Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging des requêtes
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/diplomas', diplomaRoutes);
app.use('/api/blockchain', blockchainRoutes);
app.use('/api/admin', adminRoutes);
const setupSwagger = require('./swagger');
setupSwagger(app); // Swagger UI sur /api/docs

// Route de santé
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Middleware de gestion d'erreurs
app.use(errorHandler);

// Démarrage du serveur
async function startServer() {
  try {
    // Connexion à la base de données
    await sequelize.authenticate();
    logger.info('Connexion à la base de données établie');
    
    // Synchronisation des modèles - { alter: true } met à jour le schéma de la BDD
    await sequelize.sync({ alter: true });
    logger.info('Modèles synchronisés');
    
    // Initialisation de la blockchain (optionnelle)
    try {
      await initializeBlockchain();
      logger.info('Blockchain initialisée');
    } catch (blockchainError) {
      logger.warn('Échec de l\'initialisation blockchain, continuation sans blockchain:', blockchainError.message);
    }
    
    app.listen(PORT, () => {
      logger.info(`Serveur démarré sur le port ${PORT}`);
    });
  } catch (error) {
    logger.error('Erreur lors du démarrage:', error);
    process.exit(1);
  }
}

startServer();