const logger = require('../utils/logger');

class NotificationService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> socketId
  }

  initialize(server) {
    const { Server } = require('socket.io');
    this.io = new Server(server, {
      cors: {
        origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
        methods: ["GET", "POST"],
        credentials: true
      },
      allowEIO3: true,
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000,
      upgradeTimeout: 10000,
      maxHttpBufferSize: 1e6
    });

    this.io.on('connection', (socket) => {
      logger.info(`Nouvelle connexion Socket.IO: ${socket.id}`);

      // Authentification de l'utilisateur
      socket.on('authenticate', (data) => {
        try {
          const { token, userId } = data;
          if (token && userId) {
            this.connectedUsers.set(userId, socket.id);
            socket.userId = userId;
            socket.join(`user_${userId}`);
            
            // Rejoindre les salles selon le rôle
            if (data.role === 'admin') {
              socket.join('admin_room');
            }
            if (data.role === 'emetteur') {
              socket.join('emetteur_room');
            }
            
            logger.info(`Utilisateur ${userId} authentifié sur Socket.IO`);
            
            // Envoyer une confirmation de connexion
            socket.emit('authenticated', { 
              success: true, 
              message: 'Connecté aux notifications en temps réel' 
            });
          } else {
            socket.emit('authenticated', { 
              success: false, 
              message: 'Données d\'authentification manquantes' 
            });
          }
        } catch (error) {
          logger.error('Erreur authentification Socket.IO:', error);
          socket.emit('authenticated', { 
            success: false, 
            message: 'Erreur d\'authentification' 
          });
        }
      });

      // Gestion des erreurs de connexion
      socket.on('connect_error', (error) => {
        logger.error('Erreur de connexion Socket.IO:', error);
      });

      // Déconnexion
      socket.on('disconnect', (reason) => {
        if (socket.userId) {
          this.connectedUsers.delete(socket.userId);
          logger.info(`Utilisateur ${socket.userId} déconnecté de Socket.IO. Raison: ${reason}`);
        }
      });
    });

    logger.info('Service de notifications initialisé');
  }

  // Notifier un utilisateur spécifique
  notifyUser(userId, notification) {
    if (!this.io) return;

    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit('notification', {
        ...notification,
        timestamp: new Date().toISOString()
      });
      logger.info(`Notification envoyée à l'utilisateur ${userId}: ${notification.type}`);
    }
  }

  // Notifier tous les admins
  notifyAdmins(notification) {
    if (!this.io) return;

    this.io.to('admin_room').emit('notification', {
      ...notification,
      timestamp: new Date().toISOString()
    });
    logger.info(`Notification admin envoyée: ${notification.type}`);
  }

  // Notifier tous les émetteurs
  notifyEmetteurs(notification) {
    if (!this.io) return;

    this.io.to('emetteur_room').emit('notification', {
      ...notification,
      timestamp: new Date().toISOString()
    });
    logger.info(`Notification émetteur envoyée: ${notification.type}`);
  }

  // Notifier tous les utilisateurs connectés
  broadcastToAll(notification) {
    if (!this.io) return;

    this.io.emit('notification', {
      ...notification,
      timestamp: new Date().toISOString()
    });
    logger.info(`Notification broadcast envoyée: ${notification.type}`);
  }

  // Notifications spécifiques pour les diplômes
  notifyDiplomaCreated(diploma, issuerId) {
    const notification = {
      type: 'diploma_created',
      title: 'Nouveau diplôme créé',
      message: `Le diplôme "${diploma.diploma_name}" a été créé avec succès.`,
      data: {
        diplomaId: diploma.id,
        diplomaName: diploma.diploma_name,
        studentName: `${diploma.student_firstname} ${diploma.student_lastname}`
      }
    };

    // Notifier l'émetteur
    this.notifyUser(issuerId, notification);
    
    // Notifier les admins
    this.notifyAdmins({
      ...notification,
      title: 'Nouveau diplôme créé par un émetteur',
      message: `L'émetteur a créé le diplôme "${diploma.diploma_name}" pour ${diploma.student_firstname} ${diploma.student_lastname}.`
    });
  }

  notifyDiplomaRegistered(diploma, issuerId) {
    const notification = {
      type: 'diploma_registered',
      title: 'Diplôme enregistré sur la blockchain',
      message: `Le diplôme "${diploma.diploma_name}" a été enregistré avec succès sur la blockchain.`,
      data: {
        diplomaId: diploma.id,
        diplomaName: diploma.diploma_name,
        studentName: `${diploma.student_firstname} ${diploma.student_lastname}`,
        transactionHash: diploma.blockchain_transaction_hash
      }
    };

    // Notifier l'émetteur
    this.notifyUser(issuerId, notification);
    
    // Notifier les admins
    this.notifyAdmins({
      ...notification,
      title: 'Diplôme enregistré sur la blockchain',
      message: `Le diplôme "${diploma.diploma_name}" a été enregistré sur la blockchain par l'émetteur.`
    });
  }

  notifyDiplomaVerified(diploma, verifierId) {
    const notification = {
      type: 'diploma_verified',
      title: 'Diplôme vérifié',
      message: `Le diplôme "${diploma.diploma_name}" a été vérifié avec succès.`,
      data: {
        diplomaId: diploma.id,
        diplomaName: diploma.diploma_name,
        studentName: `${diploma.student_firstname} ${diploma.student_lastname}`,
        verifierId: verifierId
      }
    };

    // Notifier le vérificateur
    this.notifyUser(verifierId, notification);
    
    // Notifier l'émetteur du diplôme
    this.notifyUser(diploma.issuer_id, {
      ...notification,
      title: 'Votre diplôme a été vérifié',
      message: `Le diplôme "${diploma.diploma_name}" a été vérifié par un utilisateur.`
    });
  }

  // Notifications système
  notifySystemMaintenance(message) {
    this.broadcastToAll({
      type: 'system_maintenance',
      title: 'Maintenance système',
      message: message,
      priority: 'high'
    });
  }

  notifyNewUser(user) {
    this.notifyAdmins({
      type: 'new_user',
      title: 'Nouvel utilisateur inscrit',
      message: `${user.first_name} ${user.last_name} (${user.email}) s'est inscrit avec le rôle ${user.role}.`,
      data: {
        userId: user.id,
        userEmail: user.email,
        userRole: user.role
      }
    });
  }

  // Obtenir les statistiques de connexion
  getConnectionStats() {
    return {
      totalConnected: this.connectedUsers.size,
      connectedUsers: Array.from(this.connectedUsers.keys())
    };
  }
}

module.exports = new NotificationService(); 