import { io } from 'socket.io-client';

class NotificationService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect(token, userId, role) {
    if (this.socket) {
      this.disconnect();
    }

    try {
      this.socket = io('http://localhost:5000', {
        transports: ['websocket', 'polling'],
        timeout: 60000,
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000
      });

      this.socket.on('connect', () => {
        console.log('Connecté aux notifications en temps réel');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // Authentifier l'utilisateur
        this.socket.emit('authenticate', { token, userId, role });
      });

      this.socket.on('authenticated', (response) => {
        if (response.success) {
          console.log('Authentification Socket.IO réussie:', response.message);
        } else {
          console.error('Échec de l\'authentification Socket.IO:', response.message);
        }
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Déconnecté des notifications. Raison:', reason);
        this.isConnected = false;
        
        // Tentative de reconnexion automatique
        if (this.reconnectAttempts < this.maxReconnectAttempts && reason !== 'io client disconnect') {
          this.reconnectAttempts++;
          console.log(`Tentative de reconnexion ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
          setTimeout(() => {
            this.connect(token, userId, role);
          }, 2000 * this.reconnectAttempts);
        }
      });

      this.socket.on('notification', (notification) => {
        console.log('Nouvelle notification reçue:', notification);
        this.handleNotification(notification);
      });

      this.socket.on('connect_error', (error) => {
        console.error('Erreur de connexion aux notifications:', error);
        this.isConnected = false;
      });

      this.socket.on('error', (error) => {
        console.error('Erreur Socket.IO:', error);
      });

      this.socket.on('reconnect', (attemptNumber) => {
        console.log(`Reconnecté après ${attemptNumber} tentatives`);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // Réauthentifier après reconnexion
        this.socket.emit('authenticate', { token, userId, role });
      });

      this.socket.on('reconnect_error', (error) => {
        console.error('Erreur de reconnexion:', error);
      });

      this.socket.on('reconnect_failed', () => {
        console.error('Échec de la reconnexion après plusieurs tentatives');
      });
    } catch (error) {
      console.error('Erreur lors de l\'initialisation Socket.IO:', error);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.reconnectAttempts = 0;
    }
  }

  handleNotification(notification) {
    // Notifier tous les listeners
    this.listeners.forEach((callback) => {
      try {
        callback(notification);
      } catch (error) {
        console.error('Erreur dans le listener de notification:', error);
      }
    });

    // Afficher une notification toast si disponible
    if (typeof window !== 'undefined' && window.showToast) {
      window.showToast(notification.title, notification.message, notification.type);
    }
  }

  // S'abonner aux notifications
  subscribe(callback) {
    const id = Date.now() + Math.random();
    this.listeners.set(id, callback);
    return () => this.listeners.delete(id); // Fonction de désabonnement
  }

  // Vérifier si connecté
  isSocketConnected() {
    return this.isConnected && this.socket?.connected;
  }
}

// Instance singleton
const notificationService = new NotificationService();

export default notificationService; 