const sequelize = require('../config/database');
const User = require('./User');
const Diploma = require('./Diploma');
const Verification = require('./Verification');
const BlockchainTransaction = require('./BlockchainTransaction');

// Associations
User.hasMany(Diploma, { foreignKey: 'issuer_id', as: 'issuedDiplomas' });
Diploma.belongsTo(User, { foreignKey: 'issuer_id', as: 'issuer' });

User.hasMany(Verification, { foreignKey: 'verifier_id', as: 'verifications' });
Verification.belongsTo(User, { foreignKey: 'verifier_id', as: 'verifier' });

Diploma.hasMany(Verification, { foreignKey: 'diploma_hash', sourceKey: 'hash', as: 'verifications' });
Verification.belongsTo(Diploma, { foreignKey: 'diploma_hash', targetKey: 'hash', as: 'diploma' });

module.exports = {
  sequelize,
  User,
  Diploma,
  Verification,
  BlockchainTransaction
};
