require('dotenv').config();
const { ethers } = require('ethers');
const { blockchainService } = require('../services/blockchainService');
const logger = require('../utils/logger');

async function fixBlockchain() {
  try {
    logger.info('🔧 Début de la correction de la configuration blockchain...');

    // 1. Vérifier les variables d'environnement
    logger.info('🔍 Vérification des variables d\'environnement...');
    
    const requiredEnvVars = [
      'BLOCKCHAIN_RPC_URL',
      'DIPLOMA_CONTRACT_ADDRESS',
      'PRIVATE_KEY'
    ];
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      logger.error('❌ Variables d\'environnement manquantes:', missingVars);
      logger.info('📝 Veuillez configurer ces variables dans votre fichier .env:');
      missingVars.forEach(varName => {
        logger.info(`   ${varName}=votre_valeur`);
      });
      return;
    }

    logger.info('✅ Variables d\'environnement configurées');

    // 2. Tester la connexion RPC
    logger.info('🌐 Test de connexion RPC...');
    try {
      const provider = blockchainService.provider;
      if (!provider) {
        logger.error('❌ Provider blockchain non initialisé');
        return;
      }

      const blockNumber = await provider.getBlockNumber();
      logger.info(`✅ Connexion RPC réussie - Block actuel: ${blockNumber}`);
    } catch (error) {
      logger.error('❌ Erreur de connexion RPC:', error.message);
      logger.info('💡 Suggestions:');
      logger.info('   - Vérifiez votre connexion internet');
      logger.info('   - Vérifiez l\'URL RPC dans BLOCKCHAIN_RPC_URL');
      logger.info('   - Essayez une URL RPC alternative');
      return;
    }

    // 3. Vérifier le contrat
    logger.info('📄 Vérification du contrat...');
    try {
      if (!blockchainService.contract) {
        logger.error('❌ Contrat non initialisé');
        return;
      }

      const contractAddress = await blockchainService.contract.getAddress();
      logger.info(`✅ Contrat trouvé à l'adresse: ${contractAddress}`);

      // Vérifier que le contrat a les bonnes fonctions
      const hasStoreDiploma = await blockchainService.contract.storeDiploma;
      const hasGetDiplomaDetails = await blockchainService.contract.getDiplomaDetails;

      if (!hasStoreDiploma) {
        logger.error('❌ Fonction storeDiploma non trouvée dans le contrat');
        return;
      }

      if (!hasGetDiplomaDetails) {
        logger.error('❌ Fonction getDiplomaDetails non trouvée dans le contrat');
        return;
      }

      logger.info('✅ Fonctions du contrat vérifiées');
    } catch (error) {
      logger.error('❌ Erreur lors de la vérification du contrat:', error.message);
      return;
    }

    // 4. Vérifier le wallet
    logger.info('💰 Vérification du wallet...');
    try {
      if (!blockchainService.signer) {
        logger.error('❌ Wallet non configuré');
        return;
      }

      const address = await blockchainService.signer.getAddress();
      const balance = await blockchainService.signer.provider.getBalance(address);
      
      logger.info(`✅ Wallet configuré: ${address}`);
      logger.info(`💰 Balance: ${ethers.formatEther(balance)} ETH/MATIC`);

      if (balance === 0n) {
        logger.warn('⚠️ Balance du wallet est 0 - impossible d\'effectuer des transactions');
        logger.info('💡 Ajoutez des fonds à votre wallet pour pouvoir enregistrer des diplômes');
      }
    } catch (error) {
      logger.error('❌ Erreur lors de la vérification du wallet:', error.message);
      return;
    }

    // 5. Test d'estimation de gas
    logger.info('⛽ Test d\'estimation de gas...');
    try {
      const testDiplomaData = {
        hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        diploma_name: 'Test Diploma',
        diploma_type: 'Licence',
        issuer_institution: 'Test University',
        emission_date: '2024-01-01',
        mention: 'Bien',
        diploma_number: 'TEST-2024-001',
        student_firstname: 'John',
        student_lastname: 'Doe',
        student_birthdate: '1990-01-01',
        student_phone: '+33123456789'
      };

      const gasEstimate = await blockchainService.estimateGasForDiplomaStorage(testDiplomaData);
      logger.info('✅ Estimation de gas réussie:', gasEstimate);
    } catch (error) {
      logger.error('❌ Erreur lors de l\'estimation de gas:', error.message);
      logger.info('💡 Cela peut indiquer un problème avec le contrat ou les données');
    }

    logger.info('🎉 Vérification blockchain terminée !');

  } catch (error) {
    logger.error('❌ Erreur lors de la vérification blockchain:', error);
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  // Initialiser le service blockchain avant de tester
  const { initializeBlockchain } = require('../services/blockchainService');
  
  initializeBlockchain()
    .then(() => {
      return fixBlockchain();
    })
    .then(() => {
      console.log('✅ Script de vérification blockchain terminé');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erreur:', error);
      process.exit(1);
    });
}

module.exports = { fixBlockchain }; 