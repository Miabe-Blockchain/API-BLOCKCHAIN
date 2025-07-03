const fs = require('fs');
const path = require('path');

function fixEnvFile() {
  const envPath = path.join(__dirname, '..', '.env');
  
  try {
    // Lire le contenu actuel
    let content = fs.readFileSync(envPath, 'utf8');
    
    console.log('🔧 Correction du fichier .env...');
    
    // Corriger l'URL Infura (ajouter le "h" manquant)
    content = content.replace(
      /INFURA_API_KEY="ttps:\/\/sepolia\.infura\.io\/v3\//,
      'INFURA_API_KEY=https://sepolia.infura.io/v3/'
    );
    
    // Supprimer les lignes vides en trop à la fin
    content = content.replace(/\n+$/, '\n');
    
    // S'assurer que toutes les variables blockchain sont présentes
    const requiredVars = [
      'BLOCKCHAIN_RPC_URL=https://sepolia.infura.io/v3/2f1dc86a4d9346059bc45b29c8331d1b',
      'DIPLOMA_CONTRACT_ADDRESS=0xAE7e43d1d8B859601F512793905fa0BA2966017A',
      'PRIVATE_KEY=c5c92ba9c2d3e53dfd1b9cbc80056af7592c3ab0f0339772fba0cea92e44e58f'
    ];
    
    requiredVars.forEach(varLine => {
      const [varName] = varLine.split('=');
      if (!content.includes(`${varName}=`)) {
        content += `\n${varLine}`;
        console.log(`✅ Ajouté: ${varName}`);
      }
    });
    
    // Écrire le fichier corrigé
    fs.writeFileSync(envPath, content);
    
    console.log('✅ Fichier .env corrigé avec succès !');
    
    // Vérifier les variables
    require('dotenv').config();
    console.log('\n📋 Variables blockchain détectées:');
    console.log(`   BLOCKCHAIN_RPC_URL: ${process.env.BLOCKCHAIN_RPC_URL ? '✅' : '❌'}`);
    console.log(`   DIPLOMA_CONTRACT_ADDRESS: ${process.env.DIPLOMA_CONTRACT_ADDRESS ? '✅' : '❌'}`);
    console.log(`   PRIVATE_KEY: ${process.env.PRIVATE_KEY ? '✅' : '❌'}`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction du fichier .env:', error.message);
  }
}

fixEnvFile(); 