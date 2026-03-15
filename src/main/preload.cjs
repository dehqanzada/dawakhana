const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('api', {
  medicine: {
    getAll: () => ipcRenderer.invoke('medicine:getAll'),
    getByBarcode: (barcode) => ipcRenderer.invoke('medicine:getByBarcode', barcode),
    create: (data) => ipcRenderer.invoke('medicine:create', data),
    update: (id, data, userId) => ipcRenderer.invoke('medicine:update', id, data, userId),
    deactivate: (id, reason, userId) => ipcRenderer.invoke('medicine:deactivate', id, reason, userId),
    getBrands: () => ipcRenderer.invoke('medicine:getBrands'),
    getCategories: () => ipcRenderer.invoke('medicine:getCategories'),
    getMovements: (id) => ipcRenderer.invoke('medicine:getMovements', id),
  },
  brand: {
    getAll: (includeInactive) => ipcRenderer.invoke('brand:getAll', includeInactive),
    create: (data) => ipcRenderer.invoke('brand:create', data),
    update: (id, data, userId) => ipcRenderer.invoke('brand:update', id, data, userId),
    deactivate: (id, userId) => ipcRenderer.invoke('brand:deactivate', id, userId),
  },
  batch: {
    create: (data) => ipcRenderer.invoke('batch:create', data),
    getByMedicine: (medicineId) => ipcRenderer.invoke('batch:getByMedicine', medicineId),
    add: (data) => ipcRenderer.invoke('batch:add', data),
    getByDateRange: (start, end) => ipcRenderer.invoke('batch:getByDateRange', start, end),
    update: (id, data, userId) => ipcRenderer.invoke('batch:update', id, data, userId),
    remove: (id, userId) => ipcRenderer.invoke('batch:delete', id, userId),
  },
  sale: {
    create: (data) => ipcRenderer.invoke('sale:create', data),
    getToday: () => ipcRenderer.invoke('sale:getToday'),
    getByDateRange: (startDate, endDate) => ipcRenderer.invoke('sale:getByDateRange', startDate, endDate),
  },
  return: {
    create: (data) => ipcRenderer.invoke('return:create', data),
    getBySale: (saleId) => ipcRenderer.invoke('return:getBySale', saleId),
  },
  customer: {
    getAll: () => ipcRenderer.invoke('customer:getAll'),
    create: (data) => ipcRenderer.invoke('customer:create', data),
    update: (id, data, userId) => ipcRenderer.invoke('customer:update', id, data, userId),
    remove: (id, userId) => ipcRenderer.invoke('customer:delete', id, userId),
    getDebt: (id) => ipcRenderer.invoke('customer:getDebt', id),
  },
  payment: {
    create: (data) => ipcRenderer.invoke('payment:create', data),
    getByCustomer: (customerId) => ipcRenderer.invoke('payment:getByCustomer', customerId),
    update: (data) => ipcRenderer.invoke('payment:update', data),
    remove: (data) => ipcRenderer.invoke('payment:delete', data),
  },
  report: {
    dailyCash: () => ipcRenderer.invoke('report:dailyCash'),
    debtList: () => ipcRenderer.invoke('report:debtList'),
    stockAlert: () => ipcRenderer.invoke('report:stockAlert'),
    salesSummary: () => ipcRenderer.invoke('report:salesSummary'),
  },
  auth: {
    login: (username, password) => ipcRenderer.invoke('auth:login', { username, password }),
    logout: () => ipcRenderer.invoke('auth:logout'),
  },
  user: {
    getAll: () => ipcRenderer.invoke('user:getAll'),
    create: (data, userId) => ipcRenderer.invoke('user:create', { data, userId }),
    update: (id, data, userId) => ipcRenderer.invoke('user:update', { id, data, userId }),
    toggleStatus: (id, userId) => ipcRenderer.invoke('user:toggleStatus', { id, userId }),
    remove: (id, userId) => ipcRenderer.invoke('user:delete', { id, userId }),
  }
});
