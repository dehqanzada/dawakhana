import { Op } from 'sequelize';
import db from '../models/index.js';
import LogService from './LogService.js';

const { Medicine, Brand, Category, Batch, StockMovement, sequelize } = db;

export default class MedicineService {
  /**
   * get all active medicines, with brand and category data
   */
  static async getAll() {
    const medicines = await Medicine.findAll({
      where: { is_active: true },
      include: [
        { model: Brand, attributes: ['id', 'name'] },
        { model: Category, attributes: ['id', 'name'], through: { attributes: [] } },
        { model: Batch, attributes: ['batch_number', 'expiry_date', 'remaining_quantity'] }
      ],
      order: [['name', 'ASC']]
    });
    return JSON.parse(JSON.stringify(medicines));
  }

  /**
   * Search by batch_barcode first, then medicine.barcode
   */
  static async getByBarcode(barcode) {
    // Check batches first
    const batch = await Batch.findOne({
      where: { batch_barcode: barcode, remaining_quantity: { [Op.gt]: 0 } },
      include: [
        {
          model: Medicine,
          where: { is_active: true },
          include: [{ model: Brand }]
        }
      ]
    });

    if (batch) {
      return JSON.parse(JSON.stringify({ type: 'batch', data: batch }));
    }

    // Check medicine barcode
    const medicine = await Medicine.findOne({
      where: { barcode: barcode, is_active: true },
      include: [
        { model: Brand },
        { model: Batch, where: { remaining_quantity: { [Op.gt]: 0 } }, required: false }
      ]
    });

    if (medicine) {
      return JSON.parse(JSON.stringify({ type: 'medicine', data: medicine }));
    }

    return null;
  }

  /**
   * create medicine + first batch in a single transaction
   */
  static async create(data) {
    const { 
      name, brand_id, barcode, unit, unit_price, shelf_number, units_per_carton,
      categories, // array of category IDs
      batch_number, batch_barcode, expiry_date, total_quantity, carton_count,
      userId // ID of user performing action
    } = data;

    const t = await sequelize.transaction();

    try {
      // 1. Create Medicine
      const medicine = await Medicine.create({
        name,
        brand_id,
        barcode: barcode || null,
        unit,
        unit_price,
        stock_quantity: total_quantity,
        shelf_number,
        units_per_carton,
        is_active: true
      }, { transaction: t });

      // 2. Assign Categories if provided
      if (categories && categories.length > 0) {
        await medicine.setCategories(categories, { transaction: t });
      }

      // 3. Create the first batch
      if (batch_number && total_quantity > 0) {
        const batch = await Batch.create({
          medicine_id: medicine.id,
          batch_number,
          batch_barcode: batch_barcode || null,
          expiry_date,
          total_quantity,
          remaining_quantity: total_quantity,
          carton_count: carton_count || 0
        }, { transaction: t });

        // Record Initial Stock Movement
        await StockMovement.create({
          medicine_id: medicine.id,
          batch_id: batch.id,
          user_id: userId,
          type: 'IN',
          quantity: total_quantity,
          reason: 'PURCHASE',
          note: 'Initial stock on creation',
          movement_date: new Date()
        }, { transaction: t });
      }

      // Log Activity
      await LogService.log(userId, 'MEDICINE_CREATE', 'medicines', medicine.id, `Created medicine: ${name} with initial batch ${batch_number}`, t);

      await t.commit();
      return medicine;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  /**
   * update price or shelf or general info
   */
  static async update(id, data, userId) {
    const medicine = await Medicine.findByPk(id);
    if (!medicine) throw new Error('Medicine not found');

    const { name, brand_id, barcode, unit, unit_price, shelf_number, units_per_carton } = data;
    
    await medicine.update({
      name, brand_id, barcode: barcode || null, unit, unit_price, shelf_number, units_per_carton
    });

    await LogService.log(userId, 'MEDICINE_UPDATE', 'medicines', id, `Updated medicine details: ${name}`);

    return medicine;
  }

  /**
   * deactivate and set reason
   */
  static async deactivate(id, reason, userId) {
    const medicine = await Medicine.findByPk(id);
    if (!medicine) throw new Error('Medicine not found');

    await medicine.update({
      is_active: false,
      deactivation_reason: reason
    });

    await LogService.log(userId, 'MEDICINE_DEACTIVATE', 'medicines', id, `Deactivated. Reason: ${reason}`);

    return true;
  }

  static async getBrands() {
    const brands = await Brand.findAll({ where: { is_active: true }, order: [['name', 'ASC']] });
    return brands.map(b => b.toJSON());
  }

  static async getCategories() {
    const categories = await Category.findAll({ where: { is_active: true }, order: [['name', 'ASC']] });
    return categories.map(c => c.toJSON());
  }

  static async getMovements(medicineId) {
    const { User, StockMovement, Batch } = db;
    const movements = await StockMovement.findAll({
      where: { medicine_id: medicineId },
      include: [
        { model: Batch, attributes: ['batch_number'] },
        { model: User, attributes: ['username'] }
      ],
      order: [['movement_date', 'DESC']],
      limit: 100
    });
    return JSON.parse(JSON.stringify(movements));
  }
}

