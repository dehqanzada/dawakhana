import bcrypt from 'bcryptjs';
import db from '../models/index.js';
import LogService from './LogService.js';

const { User } = db;

export default class UserService {
  /**
   * Helper to verify admin role
   */
  static async checkAdmin(userId) {
    const user = await User.findByPk(userId);
    if (!user || user.role !== 'admin') {
      throw new Error('Bu işlem için yönetici yetkisi gereklidir.');
    }
    return user;
  }

  /**
   * Get all users (excluding sensitive data)
   */
  static async getAll() {
    const users = await User.findAll({
      attributes: { exclude: ['password_hash'] },
      order: [['created_at', 'DESC']]
    });
    return JSON.parse(JSON.stringify(users));
  }

  /**
   * Create a new user with hashed password
   */
  static async create(data, currentUserId) {
    await this.checkAdmin(currentUserId);
    const { username, password, role } = data;

    // 1. Check if user already exists
    const existing = await User.findOne({ where: { username } });
    if (existing) throw new Error(`"${username}" ismiyle zaten bir kullanıcı var.`);

    // 2. Hash password before saving
    const password_hash = await bcrypt.hash(password, 10);
    
    const user = await User.create({
      username,
      password_hash,
      role: role || 'cashier',
      is_active: true
    });

    await LogService.log(currentUserId, 'USER_CREATE', 'users', user.id, `Created user: ${username}, Role: ${role}`);
    
    return JSON.parse(JSON.stringify(user));
  }

  /**
   * Update user details
   */
  static async update(id, data, currentUserId) {
    await this.checkAdmin(currentUserId);
    const user = await User.findByPk(id);
    if (!user) throw new Error('Kullanıcı bulunamadı.');

    const updateData = { ...data };
    
    // If password provided, re-hash it
    if (data.password && data.password.trim() !== '') {
      updateData.password_hash = await bcrypt.hash(data.password, 10);
    }
    
    // Clean up data for update
    delete updateData.password;
    delete updateData.id;
    delete updateData.username; 

    // Safety: Prevent removing admin role if it's the only admin
    if (user.role === 'admin' && data.role === 'cashier') {
      const adminCount = await User.count({ where: { role: 'admin', is_active: true } });
      if (adminCount <= 1) throw new Error('Sistemde en az bir aktif yönetici kalmalıdır.');
    }

    await user.update(updateData);
    await LogService.log(currentUserId, 'USER_UPDATE', 'users', id, `Updated user: ${user.username}`);
    
    return JSON.parse(JSON.stringify(user));
  }

  /**
   * Toggle user active/passive status
   */
  static async toggleStatus(id, currentUserId) {
    await this.checkAdmin(currentUserId);
    const user = await User.findByPk(id);
    if (!user) throw new Error('Kullanıcı bulunamadı.');

    // Safety: Prevent deactivating the last admin
    if (user.role === 'admin' && user.is_active) {
      const adminCount = await User.count({ where: { role: 'admin', is_active: true } });
      if (adminCount <= 1) throw new Error('Son yönetici hesabını kapatamazsınız.');
    }

    const newStatus = !user.is_active;
    await user.update({ is_active: newStatus });
    
    await LogService.log(
      currentUserId, 
      'USER_TOGGLE', 
      'users', 
      id, 
      `${user.username} durumu ${newStatus ? 'AKTİF' : 'PASİF'} yapıldı.`
    );
    
    return JSON.parse(JSON.stringify(user));
  }

  /**
   * Soft delete user
   */
  static async remove(id, currentUserId) {
    await this.checkAdmin(currentUserId);
    const user = await User.findByPk(id);
    if (!user) throw new Error('Kullanıcı bulunamadı.');

    // Safety: Prevent deleting the last admin
    if (user.role === 'admin') {
      const adminCount = await User.count({ where: { role: 'admin' } });
      if (adminCount <= 1) throw new Error('Son yönetici hesabını silemezsiniz.');
    }

    await user.destroy();
    await LogService.log(currentUserId, 'USER_DELETE', 'users', id, `Kullanıcı silindi: ${user.username}`);
    return true;
  }
}
