import { Op } from 'sequelize';
import db from '../models/index.js';
import LogService from './LogService.js';

const { Batch, Medicine, StockMovement, sequelize } = db;

export default class BatchService {
  /**
   * Add a new batch to an existing medicine
   */
  static async addBatch(data) {
    const { medicineId, batchNumber, batchBarcode, expiryDate, quantity, userId } = data;
    const t = await sequelize.transaction();

    try {
      const medicine = await Medicine.findByPk(medicineId, { transaction: t, lock: true });
      if (!medicine) throw new Error('Medicine not found');

      const batch = await Batch.create({
        medicine_id: medicineId,
        batch_number: batchNumber,
        batch_barcode: batchBarcode || null,
        expiry_date: expiryDate,
        total_quantity: parseFloat(quantity),
        remaining_quantity: parseFloat(quantity)
      }, { transaction: t });

      await medicine.update({
        stock_quantity: medicine.stock_quantity + parseFloat(quantity)
      }, { transaction: t });

      // Record Stock Movement
      await StockMovement.create({
        medicine_id: medicineId,
        batch_id: batch.id,
        user_id: userId,
        type: 'IN',
        quantity: parseFloat(quantity),
        reason: 'PURCHASE',
        note: `New stock entry via Stock Operations. Batch: ${batchNumber}`,
        movement_date: new Date()
      }, { transaction: t });

      await LogService.log(userId, 'BATCH_ADD', 'batches', batch.id, `Added new batch ${batchNumber} to medicine ${medicine.name}`, t);

      await t.commit();
      return JSON.parse(JSON.stringify(batch));
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  static async getByMedicine(medicineId) { 
    const batches = await Batch.findAll({ 
      where: { medicine_id: medicineId },
      include: [{ model: Medicine, attributes: ['name', 'unit'] }],
      order: [['expiry_date', 'ASC']]
    });
    return JSON.parse(JSON.stringify(batches));
  }

  static async getByDateRange(startDate, endDate) {
    const batches = await Batch.findAll({
      where: {
        created_at: {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        }
      },
      include: [
        { model: Medicine, attributes: ['name', 'unit'] }
      ],
      order: [['created_at', 'DESC']]
    });
    return JSON.parse(JSON.stringify(batches));
  }

  static async updateBatch(id, data, userId) {
    const { batchNumber, batchBarcode, expiryDate, quantity } = data;
    const t = await sequelize.transaction();

    try {
      const batch = await Batch.findByPk(id, { include: [Medicine], transaction: t, lock: true });
      if (!batch) throw new Error('Batch not found');

      const oldQuantity = parseFloat(batch.total_quantity);
      const newQuantity = parseFloat(quantity);
      const diff = newQuantity - oldQuantity;

      // Update medicine total stock
      const medicine = batch.Medicine;
      await medicine.update({
        stock_quantity: medicine.stock_quantity + diff
      }, { transaction: t });

      // Update batch
      await batch.update({
        batch_number: batchNumber,
        batch_barcode: batchBarcode || null,
        expiry_date: expiryDate,
        total_quantity: newQuantity,
        remaining_quantity: batch.remaining_quantity + diff // Adjust remaining as well
      }, { transaction: t });

      // Note: In a real system, changing quantity might be restricted if some were sold.
      // But for "erroneous entry" correction, we adjust both.

      // Record Stock Movement ADJUSTMENT
      await StockMovement.create({
        medicine_id: batch.medicine_id,
        batch_id: batch.id,
        user_id: userId,
        type: diff > 0 ? 'IN' : 'OUT',
        quantity: Math.abs(diff),
        reason: 'ADJUSTMENT',
        note: `Stok girişi düzeltildi. Fark: ${diff}. Sebep: Manuel güncelleme`,
        movement_date: new Date()
      }, { transaction: t });

      await LogService.log(userId, 'BATCH_UPDATE', 'batches', id, `Updated batch ${batchNumber}. Qty change: ${diff}`, t);

      await t.commit();
      return JSON.parse(JSON.stringify(batch));
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  static async removeBatch(id, userId) {
    const t = await sequelize.transaction();

    try {
      const batch = await Batch.findByPk(id, { include: [Medicine], transaction: t, lock: true });
      if (!batch) throw new Error('Batch not found');

      const quantityToDelete = parseFloat(batch.remaining_quantity);

      // Revert medicine total stock
      const medicine = batch.Medicine;
      await medicine.update({
        stock_quantity: medicine.stock_quantity - quantityToDelete
      }, { transaction: t });

      // Record Stock Movement OUT (Correction)
      await StockMovement.create({
        medicine_id: batch.medicine_id,
        batch_id: batch.id,
        user_id: userId,
        type: 'OUT',
        quantity: quantityToDelete,
        reason: 'ADJUSTMENT',
        note: `Stok girişi iptal edildi. Miktar: ${quantityToDelete}. Batch: ${batch.batch_number}`,
        movement_date: new Date()
      }, { transaction: t });

      await LogService.log(userId, 'BATCH_DELETE', 'batches', id, `Deleted batch ${batch.batch_number}. Reverted qty: ${quantityToDelete}`, t);

      await batch.destroy({ transaction: t });

      await t.commit();
      return true;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }
}
