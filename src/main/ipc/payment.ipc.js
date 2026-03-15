import { ipcMain } from 'electron';
import PaymentService from '../services/PaymentService.js';

export function registerPaymentIpcHandlers() {
  ipcMain.handle('payment:create', async (event, { customerId, amount, type, userId, note }) => await PaymentService.create(customerId, amount, type, userId, note));
  ipcMain.handle('payment:getByCustomer', async (event, customerId) => await PaymentService.getByCustomer(customerId));
  ipcMain.handle('payment:update', async (event, { id, amount, note, userId }) => await PaymentService.update(id, amount, note, userId));
  ipcMain.handle('payment:delete', async (event, { id, userId }) => await PaymentService.delete(id, userId));
}
