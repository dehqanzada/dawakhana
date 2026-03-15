import { ipcMain } from 'electron';
import CustomerService from '../services/CustomerService.js';

export function registerCustomerIpcHandlers() {
  ipcMain.handle('customer:getAll', async () => await CustomerService.getAll());
  ipcMain.handle('customer:create', async (event, data) => await CustomerService.create(data));
  ipcMain.handle('customer:update', async (event, id, data, userId) => await CustomerService.update(id, data, userId));
  ipcMain.handle('customer:delete', async (event, id, userId) => await CustomerService.remove(id, userId));
  ipcMain.handle('customer:getDebt', async (event, id) => await CustomerService.getDebt(id));
}
