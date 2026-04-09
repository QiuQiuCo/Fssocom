// Bridge to Electron IPC or mock data for browser dev
const isElectron = typeof window !== 'undefined' && window.api;

// In-memory mock store for browser testing
let mockUsers = [
  { id: 1, username: 'admin', password: 'admin123', role: 'admin', created_at: new Date().toISOString() },
];
let mockInventory = [
  { id: 1, name: 'Laptop Dell XPS 15', sku: 'LAP-001', barcode: '1234567890128', category: 'Electronics', quantity: 25, min_quantity: 5, price: 1299.99, cost: 899.99, supplier: 'Dell Inc.', location: 'Warehouse A', description: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 2, name: 'Wireless Mouse Logitech', sku: 'MOU-001', barcode: '2345678901234', category: 'Peripherals', quantity: 3, min_quantity: 10, price: 29.99, cost: 15.00, supplier: 'Logitech', location: 'Shelf B2', description: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 3, name: 'USB-C Hub 7-in-1', sku: 'HUB-001', barcode: '3456789012340', category: 'Accessories', quantity: 30, min_quantity: 8, price: 49.99, cost: 22.00, supplier: 'Anker', location: 'Shelf C1', description: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 4, name: 'Mechanical Keyboard', sku: 'KEY-001', barcode: '4567890123456', category: 'Peripherals', quantity: 15, min_quantity: 5, price: 89.99, cost: 45.00, supplier: 'Keychron', location: 'Shelf B3', description: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 5, name: 'Monitor 27" 4K', sku: 'MON-001', barcode: '5678901234562', category: 'Electronics', quantity: 2, min_quantity: 3, price: 449.99, cost: 280.00, supplier: 'LG Display', location: 'Warehouse A', description: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];
let mockTransactions = [];
let mockIdCounter = 6;

const mockApi = {
  login: async ({ username, password }) => {
    const user = mockUsers.find(u => u.username === username && u.password === password);
    if (user) return { success: true, user: { id: user.id, username: user.username, role: user.role } };
    return { success: false, error: 'Invalid username or password' };
  },
  changePassword: async ({ userId, oldPassword, newPassword }) => {
    const user = mockUsers.find(u => u.id === userId && u.password === oldPassword);
    if (!user) return { success: false, error: 'Current password is incorrect' };
    user.password = newPassword;
    return { success: true };
  },
  listUsers: async () => ({ success: true, data: mockUsers.map(u => ({ ...u, password: undefined })) }),
  createUser: async ({ username, password, role }) => {
    if (mockUsers.find(u => u.username === username)) return { success: false, error: 'Username already exists' };
    mockUsers.push({ id: mockIdCounter++, username, password, role, created_at: new Date().toISOString() });
    return { success: true };
  },
  deleteUser: async ({ id }) => { mockUsers = mockUsers.filter(u => u.id !== id); return { success: true }; },
  listInventory: async () => ({ success: true, data: [...mockInventory] }),
  getByBarcode: async ({ barcode }) => ({ success: true, data: mockInventory.find(i => i.barcode === barcode || i.sku === barcode) || null }),
  createItem: async (data) => {
    const item = { ...data, id: mockIdCounter++, barcode: data.barcode || data.sku, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    mockInventory.push(item);
    return { success: true, id: item.id };
  },
  updateItem: async (data) => {
    const idx = mockInventory.findIndex(i => i.id === data.id);
    if (idx >= 0) mockInventory[idx] = { ...mockInventory[idx], ...data, updated_at: new Date().toISOString() };
    return { success: true };
  },
  deleteItem: async ({ id }) => { mockInventory = mockInventory.filter(i => i.id !== id); return { success: true }; },
  adjustStock: async ({ id, quantity, type, note, userId }) => {
    const item = mockInventory.find(i => i.id === id);
    if (!item) return { success: false, error: 'Item not found' };
    let newQty = item.quantity;
    if (type === 'add') newQty += quantity;
    else if (type === 'remove') newQty = Math.max(0, newQty - quantity);
    else if (type === 'set') newQty = quantity;
    item.quantity = newQty;
    mockTransactions.unshift({ id: mockIdCounter++, item_id: id, item_name: item.name, type, quantity, note, user_id: userId, created_at: new Date().toISOString() });
    return { success: true, newQuantity: newQty };
  },
  listTransactions: async ({ limit } = {}) => ({
    success: true,
    data: limit ? mockTransactions.slice(0, limit) : mockTransactions
  }),
  getDashboardStats: async () => {
    const totalItems = mockInventory.length;
    const totalValue = mockInventory.reduce((s, i) => s + i.quantity * i.price, 0);
    const lowStock = mockInventory.filter(i => i.quantity <= i.min_quantity && i.min_quantity > 0).length;
    return { success: true, data: { totalItems, totalValue, lowStock, recentTransactions: mockTransactions.slice(0, 5) } };
  },
  minimize: () => {},
  maximize: () => {},
  close: () => {},
};

export const api = isElectron ? window.api : mockApi;
