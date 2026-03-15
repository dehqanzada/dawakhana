import { ipcMain } from 'electron';
import BrandService from '../services/BrandService.js';

export function registerBrandIpcHandlers() {
  ipcMain.handle('brand:getAll', async (event, includeInactive) => await BrandService.getAll(includeInactive));
  ipcMain.handle('brand:create', async (event, data) => await BrandService.create(data));
  ipcMain.handle('brand:update', async (event, id, data, userId) => await BrandService.update(id, data, userId));
  ipcMain.handle('brand:deactivate', async (event, id, userId) => await BrandService.deactivate(id, userId));
}
