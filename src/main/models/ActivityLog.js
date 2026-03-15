import { DataTypes } from 'sequelize';
import sequelize from '../database/connection.js';

const ActivityLog = sequelize.define('ActivityLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  action_type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  target_table: {
    type: DataTypes.STRING,
    allowNull: false
  },
  target_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  note: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  paranoid: true,
  underscored: true,
  tableName: 'activity_logs'
});

export default ActivityLog;
