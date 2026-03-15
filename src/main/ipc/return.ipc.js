import { ipcMain } from 'electron';
import ReturnService from '../services/ReturnService.js';

export function registerReturnIpcHandlers() {
  ipcMain.handle('return:create', async (event, { saleId, quantity, reason, userId }) => await ReturnService.create(saleId, quantity, reason, userId));
  ipcMain.handle('return:getBySale', async (event, saleId) => await ReturnService.getBySale(saleId));
}
