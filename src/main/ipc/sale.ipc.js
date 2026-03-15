import { ipcMain } from 'electron';
import SaleService from '../services/SaleService.js';

export function registerSaleIpcHandlers() {
  ipcMain.handle('sale:create', async (event, { items, paymentType, customerId, userId }) => await SaleService.create(items, paymentType, customerId, userId));
  ipcMain.handle('sale:getToday', async () => await SaleService.getToday());
  ipcMain.handle('sale:getByDateRange', async (event, startDate, endDate) => await SaleService.getByDateRange(startDate, endDate));
}
