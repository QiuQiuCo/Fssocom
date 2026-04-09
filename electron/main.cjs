const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// Auto-updater configuration
if (!isDev) {
  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'QiuQiuCo',
    repo: 'Fssocom'
  });

  autoUpdater.checkForUpdatesAndNotify();
  
  autoUpdater.on('update-available', () => {
    dialog.showMessageBox({
      type: 'info',
      title: 'Update Available',
      message: 'A new version is available. It will be downloaded in the background.',
    });
  });

  autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox({
      type: 'info',
      title: 'Update Ready',
      message: 'Update downloaded. The application will restart to install the update.',
      buttons: ['Restart Now', 'Later']
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  });

  autoUpdater.on('error', (err) => {
    console.error('Auto-updater error:', err);
  });
}

// Database setup
let db;

function getDbPath() {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'inventory.db');
}

function initDatabase() {
  try {
    let Database;
    if (app.isPackaged) {
      const nativePath = path.join(process.resourcesPath, 'better-sqlite3', 'build', 'Release', 'better_sqlite3.node');
      Database = require('better-sqlite3');
    } else {
      Database = require('better-sqlite3');
    }

    const dbPath = getDbPath();
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');

    // Create tables
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'staff',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        sku TEXT UNIQUE NOT NULL,
        barcode TEXT,
        category TEXT,
        quantity INTEGER DEFAULT 0,
        min_quantity INTEGER DEFAULT 0,
        price REAL DEFAULT 0,
        cost REAL DEFAULT 0,
        supplier TEXT,
        location TEXT,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id INTEGER,
        item_name TEXT,
        type TEXT,
        quantity INTEGER,
        note TEXT,
        user_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (item_id) REFERENCES inventory(id)
      );
    `);

    // Seed default admin user (password: admin123)
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
    if (!existing) {
      db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('admin', 'admin123', 'admin');
    }

    // Seed sample data
    const itemCount = db.prepare('SELECT COUNT(*) as count FROM inventory').get();
    if (itemCount.count === 0) {
      const insert = db.prepare(`
        INSERT INTO inventory (name, sku, barcode, category, quantity, min_quantity, price, cost, supplier, location)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insert.run('Laptop Dell XPS 15', 'LAP-001', '1234567890128', 'Electronics', 25, 5, 1299.99, 899.99, 'Dell Inc.', 'Warehouse A');
      insert.run('Wireless Mouse Logitech', 'MOU-001', '2345678901234', 'Peripherals', 50, 10, 29.99, 15.00, 'Logitech', 'Shelf B2');
      insert.run('USB-C Hub 7-in-1', 'HUB-001', '3456789012340', 'Accessories', 30, 8, 49.99, 22.00, 'Anker', 'Shelf C1');
      insert.run('Mechanical Keyboard', 'KEY-001', '4567890123456', 'Peripherals', 15, 5, 89.99, 45.00, 'Keychron', 'Shelf B3');
      insert.run('Monitor 27" 4K', 'MON-001', '5678901234562', 'Electronics', 12, 3, 449.99, 280.00, 'LG Display', 'Warehouse A');
    }

    console.log('Database initialized at:', dbPath);
  } catch (err) {
    console.error('Database init error:', err);
  }
}

// IPC Handlers
ipcMain.handle('auth:login', (event, { username, password }) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password);
    if (user) {
      return { success: true, user: { id: user.id, username: user.username, role: user.role } };
    }
    return { success: false, error: 'Invalid username or password' };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('auth:change-password', (event, { userId, oldPassword, newPassword }) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ? AND password = ?').get(userId, oldPassword);
    if (!user) return { success: false, error: 'Current password is incorrect' };
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(newPassword, userId);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('users:list', () => {
  try {
    const users = db.prepare('SELECT id, username, role, created_at FROM users ORDER BY created_at DESC').all();
    return { success: true, data: users };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('users:create', (event, { username, password, role }) => {
  try {
    db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run(username, password, role);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('users:delete', (event, { id }) => {
  try {
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('inventory:list', () => {
  try {
    const items = db.prepare('SELECT * FROM inventory ORDER BY name ASC').all();
    return { success: true, data: items };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('inventory:get-by-barcode', (event, { barcode }) => {
  try {
    const item = db.prepare('SELECT * FROM inventory WHERE barcode = ? OR sku = ?').get(barcode, barcode);
    return { success: true, data: item || null };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('inventory:create', (event, data) => {
  try {
    const { name, sku, barcode, category, quantity, min_quantity, price, cost, supplier, location, description } = data;
    const result = db.prepare(`
      INSERT INTO inventory (name, sku, barcode, category, quantity, min_quantity, price, cost, supplier, location, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, sku, barcode || sku, category, quantity, min_quantity, price, cost, supplier, location, description);
    return { success: true, id: result.lastInsertRowid };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('inventory:update', (event, data) => {
  try {
    const { id, name, sku, barcode, category, quantity, min_quantity, price, cost, supplier, location, description } = data;
    db.prepare(`
      UPDATE inventory SET name=?, sku=?, barcode=?, category=?, quantity=?, min_quantity=?, 
      price=?, cost=?, supplier=?, location=?, description=?, updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `).run(name, sku, barcode || sku, category, quantity, min_quantity, price, cost, supplier, location, description, id);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('inventory:delete', (event, { id }) => {
  try {
    db.prepare('DELETE FROM inventory WHERE id = ?').run(id);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('inventory:adjust-stock', (event, { id, quantity, type, note, userId }) => {
  try {
    const item = db.prepare('SELECT * FROM inventory WHERE id = ?').get(id);
    if (!item) return { success: false, error: 'Item not found' };

    let newQty = item.quantity;
    if (type === 'add') newQty += quantity;
    else if (type === 'remove') newQty = Math.max(0, newQty - quantity);
    else if (type === 'set') newQty = quantity;

    db.prepare('UPDATE inventory SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newQty, id);
    db.prepare('INSERT INTO transactions (item_id, item_name, type, quantity, note, user_id) VALUES (?, ?, ?, ?, ?, ?)')
      .run(id, item.name, type, quantity, note, userId);

    return { success: true, newQuantity: newQty };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('transactions:list', (event, { limit } = {}) => {
  try {
    const q = limit
      ? db.prepare('SELECT * FROM transactions ORDER BY created_at DESC LIMIT ?').all(limit)
      : db.prepare('SELECT * FROM transactions ORDER BY created_at DESC').all();
    return { success: true, data: q };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('stats:dashboard', () => {
  try {
    const totalItems = db.prepare('SELECT COUNT(*) as count FROM inventory').get().count;
    const totalValue = db.prepare('SELECT SUM(quantity * price) as val FROM inventory').get().val || 0;
    const lowStock = db.prepare('SELECT COUNT(*) as count FROM inventory WHERE quantity <= min_quantity AND min_quantity > 0').get().count;
    const recentTx = db.prepare('SELECT * FROM transactions ORDER BY created_at DESC LIMIT 5').all();
    return { success: true, data: { totalItems, totalValue, lowStock, recentTransactions: recentTx } };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Window creation
function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, '..', 'public', 'icon.png'),
    backgroundColor: '#0f172a',
    show: false,
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  win.once('ready-to-show', () => win.show());

  // Window controls via IPC
  ipcMain.on('window:minimize', () => win.minimize());
  ipcMain.on('window:maximize', () => win.isMaximized() ? win.unmaximize() : win.maximize());
  ipcMain.on('window:close', () => win.close());
}

app.whenReady().then(() => {
  initDatabase();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
