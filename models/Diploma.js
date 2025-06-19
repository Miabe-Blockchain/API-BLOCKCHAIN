const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Diploma = sequelize.define('Diploma', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  hash: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  diploma_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  diploma_type: {
    type: DataTypes.ENUM(
      'Licence', 'Master', 'Doctorat', 'BTS', 'DUT', 'Certificat',
      'Diplôme d\'ingénieur', 'CAP', 'Baccalauréat', 'Autre'
    ),
    allowNull: false
  },
  issuer_institution: {
    type: DataTypes.STRING,
    allowNull: false
  },
  emission_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  mention: {
    type: DataTypes.ENUM(
      'Passable', 'Assez bien', 'Bien', 'Très bien', 'Excellent', 'Sans mention'
    ),
    allowNull: false
  },
  diploma_number: {
    type: DataTypes.STRING,
    allowNull: false
  },
  student_firstname: {
    type: DataTypes.STRING,
    allowNull: false
  },
  student_lastname: {
    type: DataTypes.STRING,
    allowNull: false
  },
  student_birthdate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  student_phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  issuer_id: {
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
  qr_code_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'blockchain_confirmed', 'active', 'revoked'),
    defaultValue: 'pending'
  }
}, {
  tableName: 'diplomas',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Diploma;