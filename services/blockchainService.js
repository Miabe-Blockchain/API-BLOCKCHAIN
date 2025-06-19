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
      // Connexion au provider (Polygon Mumbai testnet ou mainnet)
      this.provider = new ethers.JsonRpcProvider(
        process.env.BLOCKCHAIN_RPC_URL || 'https://rpc-mumbai.maticvigil.com'
      );

      // Wallet du serveur pour les opérations système
      if (process.env.PRIVATE_KEY) {
        this.signer = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
      }

      // ABI du smart contract
      const contractABI = [
        "function storeDiploma(string memory hash, string memory diplomaName, string memory diplomaType, string memory issuerInstitution, uint256 emissionDate, string memory mention, string memory diplomaNumber, string memory studentName, uint256 studentBirthdate, string memory studentPhone) public payable",
        "function verifyDiploma(string memory hash) public payable returns (bool, tuple(string diplomaName, string diplomaType, string issuerInstitution, uint256 emissionDate, string mention, string diplomaNumber, string studentName, uint256 studentBirthdate, string studentPhone, address issuer, uint256 timestamp, bool exists))",
        "function getDiplomaDetails(string memory hash) public view returns (tuple(string diplomaName, string diplomaType, string issuerInstitution, uint256 emissionDate, string mention, string diplomaNumber, string studentName, uint256 studentBirthdate, string memory studentPhone, address issuer, uint256 timestamp, bool exists))",
        "event DiplomaStored(string indexed hash, address indexed issuer, string diplomaName, string studentName, uint256 timestamp)",
        "event DiplomaVerified(string indexed hash, address indexed verifier, uint256 timestamp, uint256 gasUsed)"
      ];

      // Initialisation du contrat
      this.contract = new ethers.Contract(
        process.env.CONTRACT_ADDRESS,
        contractABI,
        this.provider
      );

      logger.info('Blockchain service initialisé');
    } catch (error) {
      logger.error('Erreur d\'initialisation blockchain:', error);
      throw error;
    }
  }

  async estimateGasForDiplomaStorage(diplomaData) {
    try {
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

  async storeDiplomaOnBlockchain(diplomaData, userWallet) {
    try {
      const contractWithSigner = this.contract.connect(userWallet);

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
        diplomaData.student_phone,
        { value: ethers.parseEther("0.01") } // Frais de stockage
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

  async verifyDiplomaOnBlockchain(hash, userWallet) {
    try {
      const contractWithSigner = this.contract.connect(userWallet);

      const tx = await contractWithSigner.verifyDiploma(hash, {
        value: ethers.parseEther("0.005") // Frais de vérification
      });

      const receipt = await tx.wait();
      
      // Récupération des détails du diplôme
      const diplomaDetails = await this.contract.getDiplomaDetails(hash);

      return {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
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
      const tx = await this.provider.getTransaction(txHash);
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