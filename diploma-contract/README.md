# Smart Contract DiplomaVerifier

## Prérequis
- Node.js >= 16
- npm
- Un compte Infura (pour Sepolia)
- Un wallet Ethereum avec des ETH sur Sepolia
- Un compte Etherscan

## Installation

```bash
cd diploma-contract
npm install --save-dev hardhat @nomiclabs/hardhat-ethers @nomiclabs/hardhat-etherscan dotenv
```

Copiez `.env.example` en `.env` et remplissez vos clés :

```
cp .env.example .env
```

## Déploiement sur Sepolia

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

Notez l'adresse du contrat affichée.

## Vérification sur Etherscan

```bash
npx hardhat run scripts/verify.js --network sepolia <adresse_du_contrat>
```

## Utilisation
- `addDiploma(bytes32 diplomaHash)` : Ajoute un diplôme (par hash, réservé à l'owner)
- `verifyDiploma(bytes32 diplomaHash)` : Vérifie si un hash de diplôme existe

## Sécurité
- Seul le propriétaire du contrat peut ajouter des diplômes. 