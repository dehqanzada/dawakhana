import { Op } from 'sequelize';
import db from '../models/index.js';
import LogService from './LogService.js';

const { Sale, Batch, Medicine, Customer, StockMovement, sequelize } = db;

export default class SaleService {
  /**
   * Create sales for multiple items using FEFO (First Expire First Out)
   * items: [{ medicine_id, quantity, unit_price }]
   */
  static async create(items, paymentType, customerId, userId) {
    const t = await sequelize.transaction();

    try {
      const createdSales = [];
      let totalSaleAmount = 0;

      for (const item of items) {
        const { medicine_id, quantity, unit_price } = item;
        let remainingQuantityToSell = quantity;

        // Find all batches for this medicine with remaining stock, ordered by Expiry Date (FEFO)
        const batches = await Batch.findAll({
          where: {
            medicine_id,
            remaining_quantity: { [Op.gt]: 0 }
          },
          order: [['expiry_date', 'ASC']],
          transaction: t,
          lock: true // lock rows for update to prevent race conditions
        });

        const medicine = await Medicine.findByPk(medicine_id, { transaction: t, lock: true });

        if (!medicine || medicine.stock_quantity < quantity) {
          throw new Error(`"${medicine?.name || medicine_id}" için yeterli stok yok. (Mevcut Stok: ${medicine?.stock_quantity || 0})`);
        }

        for (const batch of batches) {
          if (remainingQuantityToSell <= 0) break;

          const sellFromBatch = Math.min(batch.remaining_quantity, remainingQuantityToSell);
          
          // Deduct from batch
          await batch.update({
            remaining_quantity: batch.remaining_quantity - sellFromBatch
          }, { transaction: t });

          // Create Sale record for this batch part
          const itemTotal = sellFromBatch * unit_price;
          totalSaleAmount += itemTotal;

          const sale = await Sale.create({
            batch_id: batch.id,
            customer_id: customerId || null,
            user_id: userId,
            quantity: sellFromBatch,
            unit_price: unit_price,
            total_price: itemTotal,
            payment_type: paymentType,
            sale_date: new Date()
          }, { transaction: t });

          createdSales.push(sale);

          // Record Stock Movement OUT
          await StockMovement.create({
            medicine_id,
            batch_id: batch.id,
            user_id: userId,
            type: 'OUT',
            quantity: sellFromBatch,
            reason: 'SALE',
            note: `Sale #${sale.id}`,
            movement_date: new Date()
          }, { transaction: t });

          remainingQuantityToSell -= sellFromBatch;
        }

        if (remainingQuantityToSell > 0) {
          // Should not happen due to the first check, but safe guard
          throw new Error('Inconsistent stock states.');
        }

        // Deduct from global medicine stock
        await medicine.update({
          stock_quantity: medicine.stock_quantity - quantity
        }, { transaction: t });
      }

      // If veresiye (on credit), increase customer balance
      if (paymentType === 'veresiye' && customerId) {
        const customer = await Customer.findByPk(customerId, { transaction: t, lock: true });
        if (!customer) throw new Error('Customer not found for credit sale');

        await customer.update({
          balance: parseFloat(customer.balance) + totalSaleAmount
        }, { transaction: t });
      }

      // Log Activity
      await LogService.log(
        userId, 
        'SALE_CREATE', 
        'sales', 
        createdSales[0]?.id, 
        `Created ${createdSales.length} sale records. Total: ${totalSaleAmount}, Type: ${paymentType}`, 
        t
      );

      await t.commit();
      
      const lastCreatedSale = createdSales[createdSales.length - 1];
      return lastCreatedSale ? JSON.parse(JSON.stringify(lastCreatedSale)) : null;
    } catch (error) {
      if (t && !t.finished) {
        await t.rollback();
      }
      throw error;
    }
  }

  static async getToday() {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    return await SaleService.getByDateRange(startOfToday, endOfToday);
  }

  static async getByDateRange(startDate, endDate) {
    const sales = await Sale.findAll({
      where: {
        sale_date: {
          [Op.between]: [startDate, endDate]
        }
      },
      include: [
        { model: Batch, include: [{ model: Medicine, attributes: ['name'] }] },
        { model: Customer, attributes: ['name'] }
      ],
      order: [['sale_date', 'DESC']]
    });

    return JSON.parse(JSON.stringify(sales));
  }
}

