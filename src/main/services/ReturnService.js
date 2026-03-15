import db from '../models/index.js';
import LogService from './LogService.js';

const { Return, Sale, Batch, Medicine, StockMovement, sequelize } = db;

export default class ReturnService {
  static async create(saleId, quantity, reason, userId) {
    const t = await sequelize.transaction();

    try {
      // 1. Find the Sale
      const sale = await Sale.findByPk(saleId, {
        include: [
          {
            model: Batch,
            include: [{ model: Medicine }]
          }
        ],
        transaction: t,
        lock: true
      });

      if (!sale) {
        throw new Error('Sale record not found.');
      }

      // Check if trying to return more than sold
      // Need to calculate how many already returned for this sale
      const previousReturns = await Return.sum('quantity', {
        where: { sale_id: saleId },
        transaction: t
      }) || 0;

      const availableToReturn = sale.quantity - previousReturns;

      if (quantity > availableToReturn) {
        throw new Error(`Cannot return ${quantity}. Only ${availableToReturn} items left from this sale.`);
      }

      // 2. Add stock back to Batch
      const batch = sale.Batch;
      await batch.update({
        remaining_quantity: batch.remaining_quantity + quantity
      }, { transaction: t });

      // 3. Add stock back to Medicine
      const medicine = batch.Medicine;
      await medicine.update({
        stock_quantity: medicine.stock_quantity + quantity
      }, { transaction: t });

      // 4. Create Return record
      const returnRecord = await Return.create({
        sale_id: saleId,
        quantity,
        reason,
        return_date: new Date()
      }, { transaction: t });

      // Record Stock Movement IN (Return)
      await StockMovement.create({
        medicine_id: medicine.id,
        batch_id: batch.id,
        user_id: userId,
        type: 'IN',
        quantity: quantity,
        reason: 'RETURN',
        note: `Returned from Sale #${saleId}. Reason: ${reason}`,
        movement_date: new Date()
      }, { transaction: t });

      // 5. Log Activity
      await LogService.log(
        userId, 
        'RETURN_CREATE', 
        'returns', 
        returnRecord.id, 
        `Returned ${quantity} items from Sale ID: ${saleId}. Reason: ${reason}`, 
        t
      );

      await t.commit();
      return returnRecord.toJSON();
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  static async getBySale(saleId) {
    const returns = await Return.findAll({
      where: { sale_id: saleId },
      order: [['return_date', 'DESC']]
    });
    return returns.map(r => r.toJSON());
  }
}

