const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

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

// ---------------------------------------------------------------------------
// Supabase client (Node.js / main process)
// Uses VITE_ env vars — they are baked into the built app by Vite but we also
// read them here from process.env for the main process (set in .env via
// electron-builder extraMetadata or a dotenv load below).
// ---------------------------------------------------------------------------
let supabase = null;
let supabaseReady = false;

function initSupabase() {
  try {
    // Load .env in development so VITE_ vars are available
    if (isDev) {
      try {
        const dotenvPath = path.join(__dirname, '..', '.env');
        if (fs.existsSync(dotenvPath)) {
          const envContent = fs.readFileSync(dotenvPath, 'utf8');
          for (const line of envContent.split('\n')) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;
            const eqIdx = trimmed.indexOf('=');
            if (eqIdx < 0) continue;
            const key = trimmed.slice(0, eqIdx).trim();
            const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
            if (!process.env[key]) process.env[key] = val;
          }
        }
      } catch (_) {}
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey ||
        supabaseUrl === 'your-supabase-url' ||
        supabaseKey === 'your-anon-key') {
      console.log('[Supabase] Not configured — running in local-only mode');
      return;
    }

    const { createClient } = require('@supabase/supabase-js');
    supabase = createClient(supabaseUrl, supabaseKey);
    supabaseReady = true;
    console.log('[Supabase] Client initialised');
  } catch (err) {
    console.error('[Supabase] Init error:', err.message);
  }
}

// ---------------------------------------------------------------------------
// Database setup (SQLite — local cache)
// ---------------------------------------------------------------------------
let db;

function getDbPath() {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'inventory.db');
}

function initDatabase() {
  try {
    const Database = require('better-sqlite3');
    const dbPath = getDbPath();
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');

    // ---- Schema ----
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        supabase_id INTEGER,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'staff',
        must_change_password INTEGER DEFAULT 0,
        expires_at TEXT,
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

    // Migration: add new columns to existing databases
    const migrations = [
      `ALTER TABLE users ADD COLUMN must_change_password INTEGER DEFAULT 0`,
      `ALTER TABLE users ADD COLUMN expires_at TEXT`,
      `ALTER TABLE users ADD COLUMN supabase_id INTEGER`,
    ];
    for (const m of migrations) {
      try { db.exec(m); } catch (_) { /* column already exists */ }
    }

    // Seed default admin if no users at all exist locally
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
    if (!existing) {
      const hashed = bcrypt.hashSync('admin123', 10);
      db.prepare(
        'INSERT INTO users (username, password, role, must_change_password) VALUES (?, ?, ?, ?)'
      ).run('admin', hashed, 'admin', 1);
    }

    // Seed sample inventory
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

    console.log('Database initialised at:', dbPath);
  } catch (err) {
    console.error('Database init error:', err);
  }
}

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

/** Cache a Supabase user row into the local SQLite users table. */
function cacheUserLocally(sbUser) {
  try {
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(sbUser.username);
    if (existing) {
      db.prepare(`
        UPDATE users SET password = ?, role = ?, must_change_password = ?,
                         expires_at = ?, supabase_id = ?
        WHERE username = ?
      `).run(
        sbUser.password,
        sbUser.role,
        sbUser.must_change_password ? 1 : 0,
        sbUser.expires_at || null,
        sbUser.id,
        sbUser.username
      );
    } else {
      db.prepare(`
        INSERT INTO users (supabase_id, username, password, role, must_change_password, expires_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        sbUser.id,
        sbUser.username,
        sbUser.password,
        sbUser.role,
        sbUser.must_change_password ? 1 : 0,
        sbUser.expires_at || null
      );
    }
  } catch (err) {
    console.error('[Cache] cacheUserLocally error:', err.message);
  }
}

// ---------------------------------------------------------------------------
// IPC — Authentication
// ---------------------------------------------------------------------------

ipcMain.handle('auth:login', async (event, { username, password }) => {
  try {
    // ---- Try Supabase first ----
    if (supabaseReady && supabase) {
      try {
        const { data: sbUsers, error } = await supabase
          .from('users')
          .select('*')
          .eq('username', username)
          .limit(1);

        if (!error && sbUsers && sbUsers.length > 0) {
          const sbUser = sbUsers[0];

          // Check expiry
          if (sbUser.expires_at && new Date(sbUser.expires_at) < new Date()) {
            // Auto-delete the expired account from Supabase
            await supabase.from('users').delete().eq('id', sbUser.id);
            // Also remove from local cache
            try { db.prepare('DELETE FROM users WHERE username = ?').run(username); } catch (_) {}
            return { success: false, error: 'Account expired. Please contact your administrator.' };
          }

          // Verify password
          const valid = bcrypt.compareSync(password, sbUser.password);
          if (!valid) return { success: false, error: 'Invalid username or password' };

          // Update local cache
          cacheUserLocally(sbUser);

          return {
            success: true,
            user: {
              id: sbUser.id,
              username: sbUser.username,
              role: sbUser.role,
              mustChangePassword: sbUser.must_change_password === true || sbUser.must_change_password === 1,
            }
          };
        }

        // Username not found in Supabase — fall through to local cache
      } catch (sbErr) {
        console.warn('[Auth] Supabase unreachable, falling back to local cache:', sbErr.message);
      }
    }

    // ---- Fallback: local SQLite cache ----
    const localUser = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!localUser) return { success: false, error: 'Invalid username or password' };

    // Check expiry in local cache
    if (localUser.expires_at && new Date(localUser.expires_at) < new Date()) {
      return { success: false, error: 'Account expired. Please contact your administrator.' };
    }

    const valid = bcrypt.compareSync(password, localUser.password);
    if (!valid) return { success: false, error: 'Invalid username or password' };

    return {
      success: true,
      user: {
        id: localUser.supabase_id || localUser.id,
        username: localUser.username,
        role: localUser.role,
        mustChangePassword: localUser.must_change_password === 1,
      }
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('auth:change-password', async (event, { userId, oldPassword, newPassword }) => {
  try {
    const hashed = bcrypt.hashSync(newPassword, 10);

    // Try Supabase first
    if (supabaseReady && supabase) {
      try {
        // Fetch by supabase id or by local id fallback
        const { data: sbUsers, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .limit(1);

        if (!error && sbUsers && sbUsers.length > 0) {
          const sbUser = sbUsers[0];
          const valid = bcrypt.compareSync(oldPassword, sbUser.password);
          if (!valid) return { success: false, error: 'Current password is incorrect' };

          await supabase
            .from('users')
            .update({ password: hashed, must_change_password: false })
            .eq('id', userId);

          // Update local cache too
          db.prepare(
            'UPDATE users SET password = ?, must_change_password = 0 WHERE supabase_id = ? OR id = ?'
          ).run(hashed, userId, userId);

          return { success: true };
        }
      } catch (sbErr) {
        console.warn('[Auth] Supabase change-password error, using local:', sbErr.message);
      }
    }

    // Local fallback
    const user = db.prepare('SELECT * FROM users WHERE id = ? OR supabase_id = ?').get(userId, userId);
    if (!user) return { success: false, error: 'User not found' };
    const valid = bcrypt.compareSync(oldPassword, user.password);
    if (!valid) return { success: false, error: 'Current password is incorrect' };
    db.prepare('UPDATE users SET password = ?, must_change_password = 0 WHERE id = ?').run(hashed, user.id);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ---------------------------------------------------------------------------
// IPC — Users CRUD (admin only, routed through Supabase)
// ---------------------------------------------------------------------------

ipcMain.handle('users:list', async () => {
  try {
    if (supabaseReady && supabase) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, username, role, must_change_password, expires_at, created_at')
          .order('created_at', { ascending: false });
        if (!error) return { success: true, data };
      } catch (sbErr) {
        console.warn('[Users] Supabase list error, using local cache:', sbErr.message);
      }
    }
    // Local fallback
    const users = db.prepare(
      'SELECT id, supabase_id, username, role, must_change_password, expires_at, created_at FROM users ORDER BY created_at DESC'
    ).all();
    return { success: true, data: users };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('users:create', async (event, { username, password, role, expires_at }) => {
  try {
    const hashed = bcrypt.hashSync(password, 10);

    if (supabaseReady && supabase) {
      try {
        const { data, error } = await supabase
          .from('users')
          .insert({
            username,
            password: hashed,
            role,
            must_change_password: true,
            expires_at: expires_at || null,
          })
          .select()
          .single();

        if (error) throw error;

        // Mirror into local cache
        cacheUserLocally(data);
        return { success: true };
      } catch (sbErr) {
        // If it's a unique constraint violation, surface it
        if (sbErr.code === '23505') {
          return { success: false, error: 'Username already exists' };
        }
        console.warn('[Users] Supabase create error:', sbErr.message);
        return { success: false, error: sbErr.message };
      }
    }

    // Local-only mode
    try {
      db.prepare(
        'INSERT INTO users (username, password, role, must_change_password, expires_at) VALUES (?, ?, ?, ?, ?)'
      ).run(username, hashed, role, 1, expires_at || null);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('users:delete', async (event, { id }) => {
  try {
    if (supabaseReady && supabase) {
      try {
        const { error } = await supabase.from('users').delete().eq('id', id);
        if (error) throw error;
      } catch (sbErr) {
        console.warn('[Users] Supabase delete error:', sbErr.message);
        return { success: false, error: sbErr.message };
      }
    }
    // Also remove from local cache
    db.prepare('DELETE FROM users WHERE supabase_id = ? OR id = ?').run(id, id);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ---------------------------------------------------------------------------
// IPC — Inventory
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// IPC — Transactions
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// IPC — Stats
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Window creation
// ---------------------------------------------------------------------------

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

  ipcMain.on('window:minimize', () => win.minimize());
  ipcMain.on('window:maximize', () => win.isMaximized() ? win.unmaximize() : win.maximize());
  ipcMain.on('window:close', () => win.close());
}

app.whenReady().then(() => {
  initSupabase();
  initDatabase();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
