import { ipcMain } from 'electron';
import MedicineService from '../services/MedicineService.js';
import BatchService from '../services/BatchService.js'; // Handled together if desired, but user separated them conceptually in channels? Wait, I will create batch.ipc.js.

export function registerMedicineIpcHandlers() {
  ipcMain.handle('medicine:getAll', async () => await MedicineService.getAll());
  ipcMain.handle('medicine:getByBarcode', async (event, barcode) => await MedicineService.getByBarcode(barcode));
  ipcMain.handle('medicine:create', async (event, data) => await MedicineService.create(data));
  ipcMain.handle('medicine:update', async (event, id, data, userId) => await MedicineService.update(id, data, userId));
  ipcMain.handle('medicine:deactivate', async (event, id, reason, userId) => await MedicineService.deactivate(id, reason, userId));
  ipcMain.handle('medicine:getBrands', async () => await MedicineService.getBrands());
  ipcMain.handle('medicine:getCategories', async () => await MedicineService.getCategories());
  ipcMain.handle('medicine:getMovements', async (event, id) => await MedicineService.getMovements(id));
}
