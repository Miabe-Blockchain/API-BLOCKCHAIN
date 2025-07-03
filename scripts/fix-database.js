const { sequelize } = require('../models');
const logger = require('../utils/logger');

async function fixDatabase() {
  try {
    logger.info('🔧 Début de la correction de la base de données...');

    // 1. Synchroniser les modèles avec la base de données
    logger.info('📋 Synchronisation des modèles...');
    await sequelize.sync({ alter: true });
    logger.info('✅ Modèles synchronisés');

    // 2. Vérifier et corriger les colonnes manquantes
    logger.info('🔍 Vérification des colonnes...');
    
    // Vérifier la table diplomas
    const [diplomaColumns] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'diplomas' 
      AND table_schema = 'public'
    `);
    
    const diplomaColumnNames = diplomaColumns.map(col => col.column_name);
    logger.info('Colonnes diplomas existantes:', diplomaColumnNames);

    // Vérifier la table users
    const [userColumns] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND table_schema = 'public'
    `);
    
    const userColumnNames = userColumns.map(col => col.column_name);
    logger.info('Colonnes users existantes:', userColumnNames);

    // 3. Ajouter les colonnes manquantes si nécessaire
    if (!diplomaColumnNames.includes('blockchain_registered_at')) {
      logger.info('➕ Ajout de la colonne blockchain_registered_at...');
      await sequelize.query(`
        ALTER TABLE diplomas 
        ADD COLUMN blockchain_registered_at TIMESTAMP
      `);
      logger.info('✅ Colonne blockchain_registered_at ajoutée');
    }

    if (!diplomaColumnNames.includes('blockchain_tx_hash')) {
      logger.info('➕ Ajout de la colonne blockchain_tx_hash...');
      await sequelize.query(`
        ALTER TABLE diplomas 
        ADD COLUMN blockchain_tx_hash VARCHAR(255)
      `);
      logger.info('✅ Colonne blockchain_tx_hash ajoutée');
    }

    if (!diplomaColumnNames.includes('qr_code_url')) {
      logger.info('➕ Ajout de la colonne qr_code_url...');
      await sequelize.query(`
        ALTER TABLE diplomas 
        ADD COLUMN qr_code_url TEXT
      `);
      logger.info('✅ Colonne qr_code_url ajoutée');
    }

    // 4. Corriger les types de colonnes si nécessaire
    logger.info('🔧 Vérification des types de colonnes...');
    
    // Vérifier le type de issuer_id
    const [issuerIdType] = await sequelize.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'diplomas' 
      AND column_name = 'issuer_id'
    `);
    
    if (issuerIdType.length > 0 && issuerIdType[0].data_type !== 'uuid') {
      logger.info('🔄 Correction du type de issuer_id...');
      await sequelize.query(`
        ALTER TABLE diplomas 
        ALTER COLUMN issuer_id TYPE UUID USING issuer_id::UUID
      `);
      logger.info('✅ Type de issuer_id corrigé');
    }

    // 5. Vérifier les contraintes de clés étrangères
    logger.info('🔗 Vérification des contraintes...');
    
    const [foreignKeys] = await sequelize.query(`
      SELECT 
        tc.constraint_name, 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = 'diplomas'
    `);
    
    const hasIssuerIdFK = foreignKeys.some(fk => fk.column_name === 'issuer_id');
    
    if (!hasIssuerIdFK) {
      logger.info('🔗 Ajout de la contrainte de clé étrangère pour issuer_id...');
      await sequelize.query(`
        ALTER TABLE diplomas 
        ADD CONSTRAINT fk_diplomas_issuer_id 
        FOREIGN KEY (issuer_id) REFERENCES users(id) 
        ON DELETE CASCADE
      `);
      logger.info('✅ Contrainte de clé étrangère ajoutée');
    }

    // 6. Créer les index nécessaires
    logger.info('📊 Création des index...');
    
    try {
      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_diplomas_hash ON diplomas(hash)
      `);
      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_diplomas_issuer_id ON diplomas(issuer_id)
      `);
      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_diplomas_status ON diplomas(status)
      `);
      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_diplomas_created_at ON diplomas(created_at)
      `);
      logger.info('✅ Index créés');
    } catch (error) {
      logger.warn('⚠️ Certains index existent déjà:', error.message);
    }

    // 7. Vérifier les données existantes
    logger.info('📊 Vérification des données...');
    
    const [diplomaCount] = await sequelize.query(`
      SELECT COUNT(*) as count FROM diplomas
    `);
    
    const [userCount] = await sequelize.query(`
      SELECT COUNT(*) as count FROM users
    `);
    
    logger.info(`📈 Diplômes: ${diplomaCount[0].count}, Utilisateurs: ${userCount[0].count}`);

    logger.info('🎉 Correction de la base de données terminée avec succès !');
    
  } catch (error) {
    logger.error('❌ Erreur lors de la correction de la base de données:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  fixDatabase()
    .then(() => {
      console.log('✅ Script de correction terminé');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erreur:', error);
      process.exit(1);
    });
}

module.exports = { fixDatabase }; 