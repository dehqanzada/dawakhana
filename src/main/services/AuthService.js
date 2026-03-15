import bcrypt from 'bcryptjs';
import db from '../models/index.js';

const { User } = db;

export default class AuthService {
  /**
   * Seeding: Create default admin if no users exist
   */
  static async initializeAdmin() {
    try {
      const count = await User.count();
      if (count === 0) {
        const hashedPassword = await bcrypt.hash('1234', 10);
        await User.create({
          username: 'admin',
          password_hash: hashedPassword,
          role: 'admin',
          is_active: true
        });
        console.log('[Auth] Default admin user created (admin/1234)');
      }
    } catch (error) {
      console.error('[Auth] Error seeding admin:', error);
    }
  }

  /**
   * Login logic
   */
  static async login(username, password) {
    try {
      const user = await User.findOne({ where: { username, is_active: true } });
      if (!user) {
        throw new Error('Kullanıcı bulunamadı veya pasif.');
      }

      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        throw new Error('Hatalı şifre.');
      }

      // Return user without password hash
      const { password_hash, ...userResult } = user.toJSON();
      return userResult;
    } catch (error) {
      console.error('[Auth] Login error:', error.message);
      throw error;
    }
  }

  static async logout() {
    return true;
  }
}
