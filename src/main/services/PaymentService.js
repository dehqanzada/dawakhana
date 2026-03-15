import db from '../models/index.js';
import LogService from './LogService.js';

const { Payment, Customer, sequelize } = db;

export default class PaymentService {
  static async create(customerId, amount, type, userId, note) {
    const t = await sequelize.transaction();

    try {
      const customer = await Customer.findByPk(customerId, { transaction: t, lock: true });
      if (!customer) throw new Error('Customer not found');

      // Create Payment
      const payment = await Payment.create({
        customer_id: customerId,
        user_id: userId,
        amount,
        type: type || 'tahsilat', // tahsilat (collection) or iade (refund)
        note,
        payment_date: new Date()
      }, { transaction: t });

      // Update Customer Balance
      // If 'tahsilat' -> balance decreases
      // If 'iade' (returning money to customer) -> balance should theoretically increase or decrease depending on accounting. Assuming tahsilat means customer paid us.
      const multiplier = payment.type === 'tahsilat' ? -1 : 1;
      const newBalance = parseFloat(customer.balance) + (parseFloat(amount) * multiplier);

      await customer.update({ balance: newBalance }, { transaction: t });

      // Log Activity
      await LogService.log(
        userId, 
        'PAYMENT_CREATE', 
        'payments', 
        payment.id, 
        `Payment (${payment.type}) of ${amount} for Customer ID: ${customerId}`, 
        t
      );

      await t.commit();
      return payment.toJSON();
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  static async getByCustomer(customerId) {
    return await Payment.findAll({
      where: { customer_id: customerId },
      order: [['payment_date', 'DESC']]
    });
  }

  static async update(id, amount, note, userId) {
    const t = await sequelize.transaction();
    try {
      const payment = await Payment.findByPk(id, { transaction: t, lock: true });
      if (!payment) throw new Error('Payment not found');

      const customer = await Customer.findByPk(payment.customer_id, { transaction: t, lock: true });
      if (!customer) throw new Error('Customer not found');

      // 1. Revert old amount
      const oldMultiplier = payment.type === 'tahsilat' ? -1 : 1;
      let currentBalance = parseFloat(customer.balance) - (parseFloat(payment.amount) * oldMultiplier);

      // 2. Apply new amount
      const newMultiplier = payment.type === 'tahsilat' ? -1 : 1; // Type shouldn't change in simple update
      const newBalance = currentBalance + (parseFloat(amount) * newMultiplier);

      // 3. Update records
      await customer.update({ balance: newBalance }, { transaction: t });
      await payment.update({ amount, note }, { transaction: t });

      await LogService.log(userId, 'PAYMENT_UPDATE', 'payments', id, `Updated payment to ${amount}`, t);

      await t.commit();
      return payment.toJSON();
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  static async delete(id, userId) {
    const t = await sequelize.transaction();
    try {
      const payment = await Payment.findByPk(id, { transaction: t, lock: true });
      if (!payment) throw new Error('Payment not found');

      const customer = await Customer.findByPk(payment.customer_id, { transaction: t, lock: true });
      if (!customer) throw new Error('Customer not found');

      // Revert balance impact
      const multiplier = payment.type === 'tahsilat' ? -1 : 1;
      const newBalance = parseFloat(customer.balance) - (parseFloat(payment.amount) * multiplier);

      await customer.update({ balance: newBalance }, { transaction: t });
      await payment.destroy({ transaction: t }); // Soft delete because of paranoid: true

      await LogService.log(userId, 'PAYMENT_DELETE', 'payments', id, `Deleted payment of ${payment.amount}`, t);

      await t.commit();
      return true;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }
}

