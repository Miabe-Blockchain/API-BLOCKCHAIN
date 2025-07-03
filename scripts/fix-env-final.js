const fs = require('fs');
const path = require('path');

function fixEnvFileFinal() {
  const envPath = path.join(__dirname, '..', '.env');
  
  try {
    // Lire le contenu actuel
    let content = fs.readFileSync(envPath, 'utf8');
    
    console.log('🔧 Correction finale du fichier .env...');
    
    // Corriger l'URL Infura (supprimer les guillemets en trop)
    content = content.replace(
      /INFURA_API_KEY="https:\/\/sepolia\.infura\.io\/v3\/2f1dc86a4d9346059bc45b29c8331d1b/,
      'INFURA_API_KEY=https://sepolia.infura.io/v3/2f1dc86a4d9346059bc45b29c8331d1b'
    );
    
    // Supprimer les lignes vides en trop à la fin
    content = content.replace(/\n+$/, '\n');
    
    // Écrire le fichier corrigé
    fs.writeFileSync(envPath, content);
    
    console.log('✅ Fichier .env corrigé définitivement !');
    
    // Vérifier les variables
    require('dotenv').config();
    console.log('\n📋 Variables blockchain détectées:');
    console.log(`   BLOCKCHAIN_RPC_URL: ${process.env.BLOCKCHAIN_RPC_URL ? '✅' : '❌'}`);
    console.log(`   DIPLOMA_CONTRACT_ADDRESS: ${process.env.DIPLOMA_CONTRACT_ADDRESS ? '✅' : '❌'}`);
    console.log(`   PRIVATE_KEY: ${process.env.PRIVATE_KEY ? '✅' : '❌'}`);
    
    if (process.env.BLOCKCHAIN_RPC_URL && process.env.DIPLOMA_CONTRACT_ADDRESS && process.env.PRIVATE_KEY) {
      console.log('\n🎉 Toutes les variables blockchain sont correctement configurées !');
    } else {
      console.log('\n⚠️ Certaines variables blockchain sont manquantes.');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction du fichier .env:', error.message);
  }
}

fixEnvFileFinal(); 