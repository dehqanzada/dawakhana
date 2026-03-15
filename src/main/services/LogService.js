import db from '../models/index.js';

const { ActivityLog } = db;

export default class LogService {
  /**
   * Centralized logging for all application actions
   * @param {number} userId - ID of the user performing the action
   * @param {string} actionType - 'CREATE', 'UPDATE', 'DELETE', 'SALE', 'RETURN', etc.
   * @param {string} targetTable - Table name affected
   * @param {number} targetId - ID of the record affected
   * @param {string} note - Descriptive details
   * @param {object} transaction - Optional Sequelize transaction
   */
  static async log(userId, actionType, targetTable, targetId, note, transaction = null) {
    try {
      await ActivityLog.create({
        user_id: userId,
        action_type: actionType,
        target_table: targetTable,
        target_id: targetId,
        note: note
      }, { transaction });
    } catch (error) {
      console.error('Logging failed:', error);
      // We don't throw here to avoid breaking the main business flow if logging fails
    }
  }
}
