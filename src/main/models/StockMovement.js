import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const StockMovement = sequelize.define('StockMovement', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    medicine_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    batch_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('IN', 'OUT', 'ADJUSTMENT'),
      allowNull: false,
      defaultValue: 'IN'
    },
    quantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    reason: {
      type: DataTypes.STRING,
      allowNull: false,
      // e.g., 'PURCHASE', 'SALE', 'RETURN', 'EXPIRED', 'CORRECTION'
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    movement_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'stock_movements',
    underscored: true,
    paranoid: true,
    timestamps: true
  });

  return StockMovement;
};
