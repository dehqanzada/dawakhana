import { Op } from 'sequelize';
import db from '../models/index.js';
import LogService from './LogService.js';

const { Customer, Sale, Payment, sequelize } = db;

export default class CustomerService {
  static async getAll() {
    const customers = await Customer.findAll({
      order: [['name', 'ASC']]
    });
    return customers.map(c => c.toJSON());
  }

  static async create(data) {
    const { name, phone, address, credit_limit, balance, userId } = data;
    const customer = await Customer.create({
      name,
      phone,
      address,
      credit_limit,
      balance: balance || 0,
      is_active: true
    });

    await LogService.log(userId, 'CUSTOMER_CREATE', 'customers', customer.id, `Created customer: ${name}`);
    return customer.toJSON();
  }

  static async update(id, data, userId) {
    const customer = await Customer.findByPk(id);
    if (!customer) throw new Error('Customer not found');

    await customer.update(data);
    await LogService.log(userId, 'CUSTOMER_UPDATE', 'customers', id, `Updated customer: ${customer.name}`);
    return customer.toJSON();
  }

  static async getDebt(customerId) {
    const customer = await Customer.findByPk(customerId);
    if (!customer) throw new Error('Customer not found');

    // Get last 20 transactions (Sales on credit + Payments)
    
    // 1. Get recent veresiye sales
    const recentSales = await Sale.findAll({
      where: { customer_id: customerId, payment_type: 'veresiye' },
      order: [['sale_date', 'DESC']],
      limit: 20
    });

    // 2. Get recent payments
    const recentPayments = await Payment.findAll({
      where: { customer_id: customerId },
      order: [['payment_date', 'DESC']],
      limit: 20
    });

    // Combine and sort by date descending, take top 20
    const allTransactions = [
      ...recentSales.map(s => ({ type: 'SALE', date: s.sale_date, amount: s.total_price, id: s.id })),
      ...recentPayments.map(p => ({ type: p.type === 'tahsilat' ? 'PAYMENT' : 'REFUND', date: p.payment_date, amount: p.amount, id: p.id, note: p.note }))
    ];

    allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    return {
      balance: customer.balance,
      transactions: allTransactions.slice(0, 20)
    };
  }
  static async remove(id, userId) {
    const customer = await Customer.findByPk(id);
    if (!customer) throw new Error('Customer not found');

    await customer.destroy();
    await LogService.log(userId, 'CUSTOMER_DELETE', 'customers', id, `Deleted customer: ${customer.name}`);
    return true;
  }
}

