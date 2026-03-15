import { DataTypes } from 'sequelize';
import sequelize from '../database/connection.js';

const Batch = sequelize.define('Batch', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  medicine_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  batch_number: {
    type: DataTypes.STRING,
    allowNull: false
  },
  batch_barcode: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true
  },
  expiry_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  total_quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  remaining_quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  carton_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
}, {
  timestamps: true,
  paranoid: true,
  underscored: true,
  tableName: 'batches'
});

export default Batch;
