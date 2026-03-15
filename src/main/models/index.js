import sequelize from '../database/connection.js';

import User from './User.js';
import Medicine from './Medicine.js';
import Brand from './Brand.js';
import Category from './Category.js';
import MedicineCategory from './MedicineCategory.js';
import Batch from './Batch.js';
import Customer from './Customer.js';
import Sale from './Sale.js';
import Return from './Return.js';
import Payment from './Payment.js';
import ActivityLog from './ActivityLog.js';
import StockMovementCreator from './StockMovement.js';

const StockMovement = StockMovementCreator(sequelize);

// Define Associations

// 1. Medicine & Brand
// Medicine belongsTo Brand
Brand.hasMany(Medicine, { foreignKey: 'brand_id' });
Medicine.belongsTo(Brand, { foreignKey: 'brand_id' });

// 2. Medicine & Category
// Medicine belongsToMany Category (through MedicineCategory)
Medicine.belongsToMany(Category, { through: MedicineCategory, foreignKey: 'medicine_id' });
Category.belongsToMany(Medicine, { through: MedicineCategory, foreignKey: 'category_id' });

// 3. Batch & Medicine
// Batch belongsTo Medicine
Medicine.hasMany(Batch, { foreignKey: 'medicine_id' });
Batch.belongsTo(Medicine, { foreignKey: 'medicine_id' });

// 4. Sale & Relationships
// Sale belongsTo Batch, Customer, User
Batch.hasMany(Sale, { foreignKey: 'batch_id' });
Sale.belongsTo(Batch, { foreignKey: 'batch_id' });

Customer.hasMany(Sale, { foreignKey: 'customer_id' });
Sale.belongsTo(Customer, { foreignKey: 'customer_id' });

User.hasMany(Sale, { foreignKey: 'user_id' });
Sale.belongsTo(User, { foreignKey: 'user_id' });

// 5. Return & Sale
// Return belongsTo Sale
Sale.hasMany(Return, { foreignKey: 'sale_id' });
Return.belongsTo(Sale, { foreignKey: 'sale_id' });

// 6. Payment & Relationships
// Payment belongsTo Customer, User
Customer.hasMany(Payment, { foreignKey: 'customer_id' });
Payment.belongsTo(Customer, { foreignKey: 'customer_id' });

User.hasMany(Payment, { foreignKey: 'user_id' });
Payment.belongsTo(User, { foreignKey: 'user_id' });

// 7. ActivityLog & User
// ActivityLog belongsTo User
User.hasMany(ActivityLog, { foreignKey: 'user_id' });
ActivityLog.belongsTo(User, { foreignKey: 'user_id' });
// 8. StockMovement & Relationships
Medicine.hasMany(StockMovement, { foreignKey: 'medicine_id' });
StockMovement.belongsTo(Medicine, { foreignKey: 'medicine_id' });

Batch.hasMany(StockMovement, { foreignKey: 'batch_id' });
StockMovement.belongsTo(Batch, { foreignKey: 'batch_id' });

User.hasMany(StockMovement, { foreignKey: 'user_id' });
StockMovement.belongsTo(User, { foreignKey: 'user_id' });

export default {
  sequelize,
  User,
  Medicine,
  Brand,
  Category,
  MedicineCategory,
  Batch,
  Customer,
  Sale,
  Return,
  Payment,
  ActivityLog,
  StockMovement
};
