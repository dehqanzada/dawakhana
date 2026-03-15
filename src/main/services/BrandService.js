import db from '../models/index.js';
import LogService from './LogService.js';

const { Brand } = db;

export default class BrandService {
  /**
   * Get all brands
   * @param {boolean} includeInactive - Whether to include inactive brands
   */
  static async getAll(includeInactive = false) {
    const where = includeInactive ? {} : { is_active: true };
    const brands = await Brand.findAll({
      where,
      order: [['name', 'ASC']]
    });
    return JSON.parse(JSON.stringify(brands));
  }

  /**
   * Create a new brand
   */
  static async create(data) {
    const { name, userId } = data;
    const brand = await Brand.create({
      name,
      is_active: true
    });

    await LogService.log(userId, 'BRAND_CREATE', 'brands', brand.id, `Created brand: ${name}`);
    return JSON.parse(JSON.stringify(brand));
  }

  /**
   * Update brand details
   */
  static async update(id, data, userId) {
    const brand = await Brand.findByPk(id);
    if (!brand) throw new Error('Marka bulunamadı');

    const { name } = data;
    await brand.update({ name });

    await LogService.log(userId, 'BRAND_UPDATE', 'brands', id, `Updated brand: ${name}`);
    return JSON.parse(JSON.stringify(brand));
  }

  /**
   * Deactivate a brand
   */
  static async deactivate(id, userId) {
    const brand = await Brand.findByPk(id);
    if (!brand) throw new Error('Marka bulunamadı');

    await brand.update({ is_active: false });

    await LogService.log(userId, 'BRAND_DEACTIVATE', 'brands', id, `Deactivated brand: ${brand.name}`);
    return true;
  }
}
