const axios = require('axios');

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || '';
const BASE_URL = 'https://api-sepolia.etherscan.io/api'; // Change selon le réseau

const etherscanService = {
  // Vérifier le statut d'une transaction
  async getTxStatus(txHash) {
    const url = `${BASE_URL}?module=transaction&action=gettxreceiptstatus&txhash=${txHash}&apikey=${ETHERSCAN_API_KEY}`;
    const { data } = await axios.get(url);
    return data;
  },

  // Obtenir le solde d'une adresse
  async getBalance(address) {
    const url = `${BASE_URL}?module=account&action=balance&address=${address}&tag=latest&apikey=${ETHERSCAN_API_KEY}`;
    const { data } = await axios.get(url);
    return data;
  },

  // Obtenir l'ABI d'un smart contract
  async getContractABI(address) {
    const url = `${BASE_URL}?module=contract&action=getabi&address=${address}&apikey=${ETHERSCAN_API_KEY}`;
    const { data } = await axios.get(url);
    return data;
  }
};

module.exports = etherscanService; 