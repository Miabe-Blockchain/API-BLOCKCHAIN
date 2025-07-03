const { fixDatabase } = require('./fix-database');
const { fixBlockchain } = require('./fix-blockchain');
const logger = require('../utils/logger');

async function fixAll() {
  try {
    logger.info('🚀 Début de la correction complète du système...');
    
    // 1. Corriger la base de données
    logger.info('📊 Étape 1: Correction de la base de données');
    await fixDatabase();
    
    // 2. Corriger la blockchain
    logger.info('⛓️ Étape 2: Correction de la blockchain');
    await fixBlockchain();
    
    // 3. Vérifications finales
    logger.info('✅ Étape 3: Vérifications finales');
    
    // Vérifier que le serveur peut démarrer
    logger.info('🔧 Test de démarrage du serveur...');
    
    // Vérifier les modèles
    const { sequelize } = require('../models');
    await sequelize.authenticate();
    logger.info('✅ Connexion à la base de données OK');
    
    // Vérifier les tables principales
    const [diplomaCount] = await sequelize.query('SELECT COUNT(*) as count FROM diplomas');
    const [userCount] = await sequelize.query('SELECT COUNT(*) as count FROM users');
    
    logger.info(`📈 Base de données: ${diplomaCount[0].count} diplômes, ${userCount[0].count} utilisateurs`);
    
    await sequelize.close();
    
    logger.info('🎉 Correction complète terminée avec succès !');
    logger.info('');
    logger.info('📋 Résumé des corrections effectuées:');
    logger.info('   ✅ Colonnes manquantes ajoutées à la base de données');
    logger.info('   ✅ Types de données corrigés');
    logger.info('   ✅ Contraintes de clés étrangères ajoutées');
    logger.info('   ✅ Index de performance créés');
    logger.info('   ✅ Configuration blockchain vérifiée');
    logger.info('');
    logger.info('💡 Prochaines étapes:');
    logger.info('   1. Redémarrez votre serveur');
    logger.info('   2. Testez la création d\'un diplôme');
    logger.info('   3. Testez la vérification d\'un diplôme');
    logger.info('   4. Vérifiez que les erreurs 500 ont disparu');
    
  } catch (error) {
    logger.error('❌ Erreur lors de la correction complète:', error);
    throw error;
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  fixAll()
    .then(() => {
      console.log('✅ Correction complète terminée');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erreur:', error);
      process.exit(1);
    });
}

module.exports = { fixAll }; 