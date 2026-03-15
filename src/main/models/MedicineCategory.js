import { DataTypes } from 'sequelize';
import sequelize from '../database/connection.js';

const MedicineCategory = sequelize.define('MedicineCategory', {
  medicine_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'medicines',
      key: 'id'
    }
  },
  category_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'categories',
      key: 'id'
    }
  }
}, {
  timestamps: false,
  underscored: true,
  tableName: 'medicine_categories'
});

export default MedicineCategory;
