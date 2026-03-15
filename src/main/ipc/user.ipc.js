import { ipcMain } from 'electron';
import UserService from '../services/UserService.js';

export function registerUserIpcHandlers() {
  ipcMain.handle('user:getAll', async () => await UserService.getAll());
  
  ipcMain.handle('user:create', async (event, { data, userId }) => 
    await UserService.create(data, userId)
  );
  
  ipcMain.handle('user:update', async (event, { id, data, userId }) => 
    await UserService.update(id, data, userId)
  );
  
  ipcMain.handle('user:toggleStatus', async (event, { id, userId }) => 
    await UserService.toggleStatus(id, userId)
  );
  
  ipcMain.handle('user:delete', async (event, { id, userId }) => 
    await UserService.remove(id, userId)
  );
}
