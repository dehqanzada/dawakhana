import { ipcMain } from 'electron';
import AuthService from '../services/AuthService.js';

export function registerAuthIpcHandlers() {
  ipcMain.handle('auth:login', async (event, { username, password }) => await AuthService.login(username, password));
  ipcMain.handle('auth:logout', async () => await AuthService.logout());
}
