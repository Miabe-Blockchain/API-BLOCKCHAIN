const { ethers } = require('ethers');
const logger = require('../utils/logger');

class BlockchainService {
  constructor() {
    this.provider = null;
    this.contract = null;
    this.signer = null;
  }

  async initialize() {
    try {
      // Utilisation de l'URL RPC configurée dans l'environnement
      this.provider = new ethers.JsonRpcProvider(
        process.env.BLOCKCHAIN_RPC_URL || 'https://rpc-mumbai.matic.today'
      );

      // Wallet du serveur pour les opérations système
      if (process.env.PRIVATE_KEY) {
        this.signer = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
      }

      // ABI du smart contract - corrigé pour correspondre au contrat DiplomaVerifier
      const contractABI = [
        "function storeDiploma(string memory _hash, string memory _diplomaName, string memory _diplomaType, string memory _issuerInstitution, uint256 _emissionDate, string memory _mention, string memory _diplomaNumber, string memory _studentName, uint256 _studentBirthdate, string memory _studentPhone) public",
        "function getDiplomaDetails(string memory _hash) public view returns (string memory diplomaName, string memory diplomaType, string memory issuerInstitution, uint256 emissionDate, string memory mention, string memory diplomaNumber, string memory studentName, uint256 studentBirthdate, string memory studentPhone, address issuer, uint256 timestamp, bool exists)",
        "event DiplomaStored(string indexed hash, address indexed issuer, string diplomaName, string studentName, uint256 timestamp)"
      ];

      // Initialisation du contrat seulement si l'adresse est définie
      if (process.env.DIPLOMA_CONTRACT_ADDRESS) {
        this.contract = new ethers.Contract(
          process.env.DIPLOMA_CONTRACT_ADDRESS,
          contractABI,
          this.provider
        );
        logger.info('Blockchain service initialisé avec contrat');
      } else {
        logger.warn('DIPLOMA_CONTRACT_ADDRESS non définie - fonctionnalités blockchain limitées');
      }

      logger.info('Blockchain service initialisé');
    } catch (error) {
      logger.error('Erreur d\'initialisation blockchain:', error);
      // Ne pas faire planter l'application si la blockchain échoue
      logger.warn('Continuation sans blockchain');
    }
  }

  async estimateGasForDiplomaStorage(diplomaData) {
    try {
      if (!this.contract) {
        throw new Error("Contrat blockchain non initialisé. Vérifiez DIPLOMA_CONTRACT_ADDRESS dans votre .env");
      }
      
      const gasEstimate = await this.contract.storeDiploma.estimateGas(
        diplomaData.hash,
        diplomaData.diploma_name,
        diplomaData.diploma_type,
        diplomaData.issuer_institution,
        Math.floor(new Date(diplomaData.emission_date).getTime() / 1000),
        diplomaData.mention,
        diplomaData.diploma_number,
        `${diplomaData.student_firstname} ${diplomaData.student_lastname}`,
        Math.floor(new Date(diplomaData.student_birthdate).getTime() / 1000),
        diplomaData.student_phone
      );

      const gasPrice = await this.provider.getFeeData();
      const estimatedCost = gasEstimate * gasPrice.gasPrice;

      return {
        gasLimit: gasEstimate.toString(),
        gasPrice: gasPrice.gasPrice.toString(),
        estimatedCost: ethers.formatEther(estimatedCost),
        estimatedCostWei: estimatedCost.toString()
      };
    } catch (error) {
      logger.error('Erreur estimation gas:', error);
      throw error;
    }
  }

  async storeDiplomaOnBlockchain(diplomaData) {
    try {
      if (!this.contract) {
        throw new Error("Contrat blockchain non initialisé. Vérifiez DIPLOMA_CONTRACT_ADDRESS dans votre .env");
      }
      
      if (!this.signer) {
        throw new Error("Le portefeuille du serveur n'est pas configuré. Vérifiez votre PRIVATE_KEY dans le .env.");
      }
      
      const contractWithSigner = this.contract.connect(this.signer);

      const tx = await contractWithSigner.storeDiploma(
        diplomaData.hash,
        diplomaData.diploma_name,
        diplomaData.diploma_type,
        diplomaData.issuer_institution,
        Math.floor(new Date(diplomaData.emission_date).getTime() / 1000),
        diplomaData.mention,
        diplomaData.diploma_number,
        `${diplomaData.student_firstname} ${diplomaData.student_lastname}`,
        Math.floor(new Date(diplomaData.student_birthdate).getTime() / 1000),
        diplomaData.student_phone
      );

      const receipt = await tx.wait();
      
      return {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        status: receipt.status === 1 ? 'confirmed' : 'failed'
      };
    } catch (error) {
      logger.error('Erreur stockage blockchain:', error);
      throw error;
    }
  }

  async verifyDiplomaOnBlockchain(hash) {
    try {
      if (!this.contract) {
        throw new Error("Contrat blockchain non initialisé. Vérifiez DIPLOMA_CONTRACT_ADDRESS dans votre .env");
      }
      
      // Récupération des détails du diplôme
      const diplomaDetails = await this.contract.getDiplomaDetails(hash);

      return {
        isValid: diplomaDetails.exists,
        diplomaInfo: diplomaDetails.exists ? {
          diplomaName: diplomaDetails.diplomaName,
          diplomaType: diplomaDetails.diplomaType,
          issuerInstitution: diplomaDetails.issuerInstitution,
          emissionDate: new Date(Number(diplomaDetails.emissionDate) * 1000),
          mention: diplomaDetails.mention,
          diplomaNumber: diplomaDetails.diplomaNumber,
          studentName: diplomaDetails.studentName,
          studentBirthdate: new Date(Number(diplomaDetails.studentBirthdate) * 1000),
          studentPhone: diplomaDetails.studentPhone,
          issuerAddress: diplomaDetails.issuer,
          timestamp: new Date(Number(diplomaDetails.timestamp) * 1000)
        } : null
      };
    } catch (error) {
      logger.error('Erreur vérification blockchain:', error);
      throw error;
    }
  }

  async getTransactionDetails(txHash) {
    try {
      if (!ethers.isHexString(txHash, 32)) {
        throw new Error('Format de hash de transaction invalide.');
      }
      
      const tx = await this.provider.getTransaction(txHash);
      if (!tx) {
        return null; // ou lancer une erreur 404
      }
      
      const receipt = await this.provider.getTransactionReceipt(txHash);

      return {
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: ethers.formatEther(tx.value),
        gasPrice: tx.gasPrice.toString(),
        gasLimit: tx.gasLimit.toString(),
        gasUsed: receipt ? receipt.gasUsed.toString() : null,
        blockNumber: receipt ? receipt.blockNumber : null,
        status: receipt ? (receipt.status === 1 ? 'confirmed' : 'failed') : 'pending',
        timestamp: tx.timestamp ? new Date(tx.timestamp * 1000) : null
      };
    } catch (error) {
      logger.error('Erreur récupération transaction:', error);
      throw error;
    }
  }
}

const blockchainService = new BlockchainService();

const initializeBlockchain = async () => {
  await blockchainService.initialize();
};

module.exports = {
  blockchainService,
  initializeBlockchain
};