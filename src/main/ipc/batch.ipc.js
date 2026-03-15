import { ipcMain } from 'electron';
import BatchService from '../services/BatchService.js';

export function registerBatchIpcHandlers() {
  ipcMain.handle('batch:create', async (event, data) => await BatchService.create(data));
  ipcMain.handle('batch:getByMedicine', async (event, medicineId) => await BatchService.getByMedicine(medicineId));
  ipcMain.handle('batch:add', async (event, data) => await BatchService.addBatch(data));
  ipcMain.handle('batch:getByDateRange', async (event, startDate, endDate) => await BatchService.getByDateRange(startDate, endDate));
  ipcMain.handle('batch:update', async (event, id, data, userId) => await BatchService.updateBatch(id, data, userId));
  ipcMain.handle('batch:delete', async (event, id, userId) => await BatchService.removeBatch(id, userId));
}
