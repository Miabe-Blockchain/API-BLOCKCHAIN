const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Verification = sequelize.define('Verification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  diploma_hash: {
    type: DataTypes.STRING,
    allowNull: false
  },
  verifier_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  blockchain_tx_hash: {
    type: DataTypes.STRING,
    allowNull: true
  },
  verification_result: {
    type: DataTypes.ENUM('valid', 'invalid', 'not_found'),
    allowNull: false
  },
  ip_address: {
    type: DataTypes.STRING,
    allowNull: true
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  gas_used: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'verifications',
  timestamps: true,
  createdAt: 'verified_at',
  updatedAt: false
});

module.exports = Verification;