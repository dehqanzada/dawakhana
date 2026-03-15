import { Op, fn, col, literal } from 'sequelize';
import db from '../models/index.js';

const { Sale, Return, Payment, Customer, Batch, Medicine, sequelize } = db;

export default class ReportService {
  /**
   * Daily Cash Summary
   */
  static async dailyCash(dateStr) {
    if (!dateStr || dateStr === 'undefined' || dateStr === 'null') {
      dateStr = new Date().toISOString().split('T')[0];
    }
    
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw new Error(`Geçersiz tarih formatı: ${dateStr}`);
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // 1. Cash Sales
    const cashSales = await Sale.sum('total_price', {
      where: { 
        payment_type: 'nakit',
        sale_date: { [Op.between]: [startOfDay, endOfDay] }
      }
    }) || 0;

    // 2. Credit Sales (Veresiye)
    const creditSales = await Sale.sum('total_price', {
      where: { 
        payment_type: 'veresiye',
        sale_date: { [Op.between]: [startOfDay, endOfDay] }
      }
    }) || 0;

    // 3. Collections (Tahsilat)
    const collections = await Payment.sum('amount', {
      where: { 
        type: 'tahsilat',
        payment_date: { [Op.between]: [startOfDay, endOfDay] }
      }
    }) || 0;

    // 4. Returns (İadeler) - Sum of (Return.quantity * Sale.unit_price)
    const returns = await Return.findAll({
      where: {
        return_date: { [Op.between]: [startOfDay, endOfDay] }
      },
      include: [{ model: Sale, attributes: ['unit_price'] }]
    });

    const returnTotal = returns.reduce((sum, r) => sum + (r.quantity * parseFloat(r.Sale.unit_price)), 0);

    return {
      date: dateStr,
      cashSales: parseFloat(cashSales),
      creditSales: parseFloat(creditSales),
      collections: parseFloat(collections),
      returns: returnTotal,
      netCash: parseFloat(cashSales) + parseFloat(collections) - returnTotal
    };
  }

  static async debtList() {
    const customers = await Customer.findAll({
      where: { balance: { [Op.gt]: 0 } },
      order: [['balance', 'DESC']]
    });
    return JSON.parse(JSON.stringify(customers));
  }

  /**
   * Stock Alerts: Low quantity or near expiry
   */
  static async stockAlert() {
    const today = new Date();
    const thirtyDaysLater = new Date(new Date().setDate(today.getDate() + 30));

    const alerts = await Batch.findAll({
      where: {
        [Op.or]: [
          { remaining_quantity: { [Op.lte]: 10 } },
          { expiry_date: { [Op.lte]: thirtyDaysLater } }
        ],
        remaining_quantity: { [Op.gt]: 0 } // Only alert for items still in stock
      },
      include: [{ model: Medicine, attributes: ['name', 'barcode'] }],
      order: [['expiry_date', 'ASC']]
    });

    return alerts.map(b => ({
      medicineName: b.Medicine.name,
      barcode: b.Medicine.barcode,
      batchNumber: b.batch_number,
      remainingQuantity: b.remaining_quantity,
      expiryDate: b.expiry_date,
      type: b.remaining_quantity <= 10 ? 'LOW_STOCK' : 'NEAR_EXPIRY'
    }));
  }

  /**
   * Sales summary and Top 10 Products within a date range
   */
  static async salesSummary(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Geçersiz tarih aralığı');
    }

    end.setHours(23, 59, 59, 999);

    // 1. Total Stats
    const totalSalesQuantity = await Sale.sum('quantity', {
      where: { sale_date: { [Op.between]: [start, end] } }
    }) || 0;

    const totalRevenue = await Sale.sum('total_price', {
      where: { sale_date: { [Op.between]: [start, end] } }
    }) || 0;

    // 2. Top 10 Products
    // We need to sum quantity grouped by medicine through Batch
    const topProducts = await Sale.findAll({
      attributes: [
        [fn('SUM', col('Sale.quantity')), 'total_quantity'],
        [col('Batch->Medicine.name'), 'medicine_name']
      ],
      where: { sale_date: { [Op.between]: [start, end] } },
      include: [{
        model: Batch,
        attributes: [],
        include: [{ 
          model: Medicine, 
          attributes: []
        }]
      }],
      group: [col('Batch->Medicine.id'), col('Batch->Medicine.name')],
      order: [[literal('total_quantity'), 'DESC']],
      limit: 10,
      raw: true
    });

    return {
      summary: {
        totalQuantity: parseInt(totalSalesQuantity),
        totalRevenue: parseFloat(totalRevenue)
      },
      topProducts
    };
  }
}
