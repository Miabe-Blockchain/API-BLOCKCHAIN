class WalletService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.account = null;
    this.chainId = null;
    this.isConnected = false;
  }

  // Vérifier si MetaMask est disponible
  isMetaMaskAvailable() {
    return typeof window !== 'undefined' && window.ethereum && window.ethereum.isMetaMask;
  }

  // Vérifier si l'utilisateur est connecté à MetaMask
  async checkConnection() {
    if (!this.isMetaMaskAvailable()) {
      throw new Error('MetaMask n\'est pas installé');
    }

    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        this.account = accounts[0];
        this.isConnected = true;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erreur vérification connexion MetaMask:', error);
      throw error;
    }
  }

  // Se connecter à MetaMask
  async connect() {
    if (!this.isMetaMaskAvailable()) {
      throw new Error('MetaMask n\'est pas installé. Veuillez l\'installer depuis https://metamask.io/');
    }

    try {
      // Demander la connexion
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });

      if (accounts.length === 0) {
        throw new Error('Aucun compte connecté');
      }

      this.account = accounts[0];
      this.isConnected = true;

      // Obtenir le chainId
      this.chainId = await window.ethereum.request({ 
        method: 'eth_chainId' 
      });

      // Vérifier que nous sommes sur Sepolia
      if (this.chainId !== '0xaa36a7') { // Sepolia chainId
        await this.switchToSepolia();
      }

      return {
        account: this.account,
        chainId: this.chainId,
        isConnected: true
      };
    } catch (error) {
      console.error('Erreur connexion MetaMask:', error);
      throw error;
    }
  }

  // Se déconnecter
  disconnect() {
    this.provider = null;
    this.signer = null;
    this.account = null;
    this.chainId = null;
    this.isConnected = false;
  }

  // Basculer vers le réseau Sepolia
  async switchToSepolia() {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }], // Sepolia
      });
      this.chainId = '0xaa36a7';
    } catch (switchError) {
      // Si le réseau n'existe pas, l'ajouter
      if (switchError.code === 4902) {
        await this.addSepoliaNetwork();
      } else {
        throw switchError;
      }
    }
  }

  // Ajouter le réseau Sepolia
  async addSepoliaNetwork() {
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0xaa36a7',
          chainName: 'Sepolia',
          nativeCurrency: {
            name: 'Sepolia Ether',
            symbol: 'SEP',
            decimals: 18
          },
          rpcUrls: ['https://sepolia.infura.io/v3/'],
          blockExplorerUrls: ['https://sepolia.etherscan.io/']
        }]
      });
      this.chainId = '0xaa36a7';
    } catch (error) {
      console.error('Erreur ajout réseau Sepolia:', error);
      throw error;
    }
  }

  // Obtenir le solde ETH
  async getBalance() {
    if (!this.isConnected || !this.account) {
      throw new Error('Wallet non connecté');
    }

    try {
      const balance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [this.account, 'latest']
      });

      // Convertir de wei vers ETH
      const balanceInEth = parseInt(balance, 16) / Math.pow(10, 18);
      return balanceInEth;
    } catch (error) {
      console.error('Erreur récupération solde:', error);
      throw error;
    }
  }

  // Signer un message
  async signMessage(message) {
    if (!this.isConnected || !this.account) {
      throw new Error('Wallet non connecté');
    }

    try {
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, this.account]
      });

      return signature;
    } catch (error) {
      console.error('Erreur signature message:', error);
      throw error;
    }
  }

  // Signer une transaction
  async signTransaction(transaction) {
    if (!this.isConnected || !this.account) {
      throw new Error('Wallet non connecté');
    }

    try {
      const signature = await window.ethereum.request({
        method: 'eth_signTransaction',
        params: [transaction]
      });

      return signature;
    } catch (error) {
      console.error('Erreur signature transaction:', error);
      throw error;
    }
  }

  // Envoyer une transaction
  async sendTransaction(transaction) {
    if (!this.isConnected || !this.account) {
      throw new Error('Wallet non connecté');
    }

    try {
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [transaction]
      });

      return txHash;
    } catch (error) {
      console.error('Erreur envoi transaction:', error);
      throw error;
    }
  }

  // Écouter les changements de compte
  onAccountsChanged(callback) {
    if (!this.isMetaMaskAvailable()) return;

    window.ethereum.on('accountsChanged', (accounts) => {
      if (accounts.length === 0) {
        // Déconnecté
        this.disconnect();
        callback(null);
      } else {
        // Changement de compte
        this.account = accounts[0];
        callback(this.account);
      }
    });
  }

  // Écouter les changements de réseau
  onChainChanged(callback) {
    if (!this.isMetaMaskAvailable()) return;

    window.ethereum.on('chainChanged', (chainId) => {
      this.chainId = chainId;
      callback(chainId);
    });
  }

  // Obtenir les informations du wallet
  getWalletInfo() {
    return {
      isConnected: this.isConnected,
      account: this.account,
      chainId: this.chainId,
      isMetaMaskAvailable: this.isMetaMaskAvailable()
    };
  }

  // Vérifier si l'adresse est valide
  isValidAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  // Formater une adresse pour l'affichage
  formatAddress(address, start = 6, end = 4) {
    if (!address) return '';
    return `${address.substring(0, start)}...${address.substring(address.length - end)}`;
  }
}

export default new WalletService(); 