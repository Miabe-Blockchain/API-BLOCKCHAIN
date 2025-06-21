# Blockchain Diploma API

API Node.js complète pour la gestion, la vérification et l'émission de diplômes via la blockchain Ethereum (réseau Sepolia).

---

## Sommaire
- [Fonctionnalités](#fonctionnalités)
- [Architecture](#architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [Lancement](#lancement)
- [Utilisation de l'API](#utilisation-de-lapi)
- [Blockchain Integration](#blockchain-integration)
- [Authentification & JWT](#authentification--jwt)
- [Documentation Swagger](#documentation-swagger)
- [Exemples de requêtes](#exemples-de-requêtes)
- [Dépannage](#dépannage)
- [Notes](#notes)

---

## Fonctionnalités

### 🔐 Authentification & Sécurité
- Inscription et connexion utilisateur (JWT)
- 2FA (authentification à deux facteurs)
- Gestion des rôles (admin, emetteur, utilisateur)
- Middleware de protection des routes

### 📜 Gestion des Diplômes
- Création, consultation, modification et suppression de diplômes
- Stockage sécurisé en base de données PostgreSQL
- Génération de QR codes pour vérification
- Export et import de données

### ⛓️ Blockchain Integration
- **Smart Contract** : `DiplomaVerifier.sol` déployé sur Sepolia
- Enregistrement immuable des diplômes sur la blockchain
- Vérification cryptographique des diplômes
- Traçabilité complète des émissions

### 🎛️ Administration
- Dashboard administrateur complet
- Statistiques en temps réel
- Gestion des utilisateurs
- Monitoring des transactions blockchain

### 📚 Documentation
- Documentation interactive Swagger
- API complètement documentée
- Exemples de requêtes

---

## Architecture

```
bed/
├── diploma-contract/          # Smart Contract Solidity
│   ├── contracts/
│   │   └── DiplomaVerifier.sol
│   ├── scripts/
│   │   └── deploy.js
│   └── hardhat.config.js
├── frontend/                  # Interface Next.js
├── models/                    # Modèles Sequelize
├── routes/                    # Routes API
├── services/                  # Services (blockchain, email, etc.)
├── middleware/                # Middleware d'authentification
└── server.js                  # Serveur principal
```

---

## Installation

1. **Cloner le dépôt**
   ```bash
   git clone <repo-url>
   cd bed
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   cd diploma-contract && npm install
   cd ../frontend && npm install
   ```

3. **Configurer la base de données**
   ```bash
   docker-compose up -d postgres
   ```

---

## Configuration

Créez un fichier `.env` à la racine du projet :

```env
# Base de données
DB_HOST=localhost
DB_PORT=5432
DB_NAME=blockchain_diplomas
DB_USER=postgres
DB_PASSWORD=4606

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# Serveur
PORT=5000
NODE_ENV=development

# Blockchain (Sepolia)
BLOCKCHAIN_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
PRIVATE_KEY=your_server_private_key
DIPLOMA_CONTRACT_ADDRESS=0xAE7e43d1d8B859601F512793905fa0BA2966017A

# Infura (pour le déploiement du contrat)
INFURA_API_KEY=your_infura_api_key
ETHERSCAN_API_KEY=your_etherscan_api_key
```

---

## Lancement

### Serveur Backend
```bash
npm start
```
Le serveur démarre sur [http://localhost:5000](http://localhost:5000)

### Frontend (optionnel)
```bash
cd frontend
npm run dev
```
Interface disponible sur [http://localhost:3000](http://localhost:3000)

---

## Utilisation de l'API

- **Base URL** : `http://localhost:5000/api`
- **Authentification** : Token JWT dans le header `Authorization: Bearer <token>`
- **Documentation** : [http://localhost:5000/api/docs](http://localhost:5000/api/docs)

---

## Blockchain Integration

### Smart Contract
Le contrat `DiplomaVerifier.sol` est déployé sur le réseau Sepolia et permet :
- Enregistrement immuable des diplômes
- Vérification cryptographique
- Traçabilité des émissions

### Fonctions principales
- `storeDiploma()` : Enregistre un diplôme sur la blockchain
- `getDiplomaDetails()` : Récupère les détails d'un diplôme
- `DiplomaStored` : Événement émis lors de l'enregistrement

### Redéploiement du contrat
```bash
cd diploma-contract
npx hardhat run scripts/deploy.js --network sepolia
```

---

## Authentification & JWT

### Inscription
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Test1234",
  "first_name": "Jean",
  "last_name": "Dupont",
  "role": "emetteur",
  "phone": "+22892504606"
}
```

### Connexion
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Test1234"
}
```

---

## Documentation Swagger

- **URL** : [http://localhost:5000/api/docs](http://localhost:5000/api/docs)
- Testez toutes les routes directement depuis l'interface
- Documentation complète de tous les endpoints

---

## Exemples de requêtes

### Créer un diplôme
```http
POST /api/diplomas
Authorization: Bearer <token>
Content-Type: application/json

{
  "diploma_name": "Licence en Intelligence Artificielle",
  "diploma_type": "Licence",
  "issuer_institution": "Lil_cycllione_Valley",
  "emission_date": "2024-01-15",
  "mention": "Très bien",
  "diploma_number": "MIA-2024-01-158",
  "student_firstname": "joe maxx",
  "student_lastname": "Doe",
  "student_birthdate": "1990-05-15",
  "student_phone": "99040434"
}
```

### Enregistrer sur la blockchain
```http
POST /api/blockchain/register-diploma/:diplomaId
Authorization: Bearer <token>
```

### Vérifier un diplôme
```http
GET /api/blockchain/verify/:hash
```

---

## Dépannage

### Erreurs courantes

1. **Erreur de connexion blockchain**
   - Vérifiez `BLOCKCHAIN_RPC_URL` dans `.env`
   - Assurez-vous que l'URL Sepolia est correcte

2. **Erreur CALL_EXCEPTION**
   - Le contrat a été redéployé avec succès
   - Vérifiez `DIPLOMA_CONTRACT_ADDRESS` dans `.env`

3. **Erreur de base de données**
   - Lancez `docker-compose up -d postgres`
   - Vérifiez les variables DB_* dans `.env`

4. **Erreur JWT**
   - Vérifiez `JWT_SECRET` dans `.env`
   - Assurez-vous que le token n'a pas expiré

### Logs
Les logs détaillés sont disponibles dans le dossier `logs/`

---

## Notes

- ✅ **Système blockchain opérationnel** sur Sepolia
- ✅ **Smart contract déployé** et fonctionnel
- ✅ **API complète** avec documentation Swagger
- ✅ **Base de données** PostgreSQL configurée
- ✅ **Authentification JWT** sécurisée
- ✅ **Interface d'administration** disponible

### Rôles utilisateurs
- **admin** : Accès complet à toutes les fonctionnalités
- **emetteur** : Peut créer et enregistrer des diplômes
- **utilisateur** : Peut consulter et vérifier les diplômes

### Support
Pour toute question ou problème, contactez : christianehouanou@gmail.com

---

**Version** : 2.0.0  
**Dernière mise à jour** : Janvier 2024  
**Statut** : ✅ Production Ready
