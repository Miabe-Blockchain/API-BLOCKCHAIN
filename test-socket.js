const io = require('socket.io-client');

console.log('Test de connexion Socket.IO...');

const socket = io('http://localhost:5000', {
  transports: ['websocket', 'polling'],
  timeout: 10000,
  forceNew: true
});

socket.on('connect', () => {
  console.log('✅ Connecté au serveur Socket.IO');
  console.log('Socket ID:', socket.id);
  
  // Tester l'authentification
  socket.emit('authenticate', { 
    token: 'test-token', 
    userId: 'test-user', 
    role: 'admin' 
  });
});

socket.on('authenticated', (response) => {
  console.log('✅ Authentification:', response);
});

socket.on('disconnect', (reason) => {
  console.log('❌ Déconnecté:', reason);
});

socket.on('connect_error', (error) => {
  console.log('❌ Erreur de connexion:', error.message);
});

socket.on('error', (error) => {
  console.log('❌ Erreur Socket.IO:', error);
});

// Arrêter le test après 10 secondes
setTimeout(() => {
  console.log('Test terminé');
  socket.disconnect();
  process.exit(0);
}, 10000); 