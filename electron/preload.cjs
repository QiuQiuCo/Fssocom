const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Auth
  login: (credentials) => ipcRenderer.invoke('auth:login', credentials),
  changePassword: (data) => ipcRenderer.invoke('auth:change-password', data),

  // Users
  listUsers: () => ipcRenderer.invoke('users:list'),
  createUser: (data) => ipcRenderer.invoke('users:create', data),
  deleteUser: (data) => ipcRenderer.invoke('users:delete', data),

  // Inventory
  listInventory: () => ipcRenderer.invoke('inventory:list'),
  getByBarcode: (data) => ipcRenderer.invoke('inventory:get-by-barcode', data),
  createItem: (data) => ipcRenderer.invoke('inventory:create', data),
  updateItem: (data) => ipcRenderer.invoke('inventory:update', data),
  deleteItem: (data) => ipcRenderer.invoke('inventory:delete', data),
  adjustStock: (data) => ipcRenderer.invoke('inventory:adjust-stock', data),

  // Transactions
  listTransactions: (opts) => ipcRenderer.invoke('transactions:list', opts),

  // Stats
  getDashboardStats: () => ipcRenderer.invoke('stats:dashboard'),

  // Window controls
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),
});
