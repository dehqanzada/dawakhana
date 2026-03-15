import { ipcMain } from 'electron';
import ReportService from '../services/ReportService.js';

export function registerReportIpcHandlers() {
  ipcMain.handle('report:dailyCash', async (event, dateStr) => await ReportService.dailyCash(dateStr));
  ipcMain.handle('report:debtList', async () => await ReportService.debtList());
  ipcMain.handle('report:stockAlert', async () => await ReportService.stockAlert());
  ipcMain.handle('report:salesSummary', async (event, startDate, endDate) => await ReportService.salesSummary(startDate, endDate));
}
