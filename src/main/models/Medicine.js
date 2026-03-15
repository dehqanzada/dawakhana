import { DataTypes } from 'sequelize';
import sequelize from '../database/connection.js';

const Medicine = sequelize.define('Medicine', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  brand_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  barcode: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true
  },
  unit: {
    type: DataTypes.STRING,
    allowNull: true
  },
  unit_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  stock_quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  shelf_number: {
    type: DataTypes.STRING,
    allowNull: true
  },
  units_per_carton: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 1
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  deactivation_reason: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true,
  paranoid: true,
  underscored: true,
  tableName: 'medicines'
});

export default Medicine;
