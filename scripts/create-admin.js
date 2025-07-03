const bcrypt = require('bcrypt');
const { User } = require('../models');
const logger = require('../utils/logger');

async function createAdminUser() {
  try {
    // Vérifier si l'admin existe déjà
    const existingAdmin = await User.findOne({ 
      where: { email: 'admin@blockchain-diploma.com' } 
    });

    if (existingAdmin) {
      logger.info('L\'utilisateur admin existe déjà');
      return existingAdmin;
    }

    // Créer le hash du mot de passe
    const passwordHash = await bcrypt.hash('Admin123!', 10);

    // Créer l'utilisateur admin
    const adminUser = await User.create({
      email: 'admin@blockchain-diploma.com',
      password_hash: passwordHash,
      first_name: 'Admin',
      last_name: 'System',
      role: 'admin',
      status: 'active',
      institution_name: 'Blockchain Diploma System',
      phone: '+1234567890'
    });

    logger.info('Utilisateur admin créé avec succès:', {
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.role
    });

    return adminUser;
  } catch (error) {
    logger.error('Erreur création utilisateur admin:', error);
    throw error;
  }
}

// Exécuter si le script est appelé directement
if (require.main === module) {
  createAdminUser()
    .then(() => {
      console.log('✅ Utilisateur admin créé avec succès');
      console.log('📧 Email: admin@blockchain-diploma.com');
      console.log('🔑 Mot de passe: Admin123!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erreur:', error.message);
      process.exit(1);
    });
}

module.exports = { createAdminUser }; 