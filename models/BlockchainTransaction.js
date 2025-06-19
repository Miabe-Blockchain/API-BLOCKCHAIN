const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BlockchainTransaction = sequelize.define('BlockchainTransaction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  tx_hash: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  operation_type: {
    type: DataTypes.ENUM('diploma_creation', 'diploma_verification', 'wallet_connection'),
    allowNull: false
  },
  wallet_address: {
    type: DataTypes.STRING,
    allowNull: false
  },
  gas_used: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  gas_price: {
    type: DataTypes.STRING,
    allowNull: true
  },
  transaction_fee: {
    type: DataTypes.STRING,
    allowNull: true
  },
  block_number: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'failed'),
    defaultValue: 'pending'
  },
  related_entity_id: {
    type: DataTypes.UUID,
    allowNull: true
  }
}, {
  tableName: 'blockchain_transactions',
  timestamps: true,
  createdAt: 'timestamp',
  updatedAt: false
});

module.exports = BlockchainTransaction;