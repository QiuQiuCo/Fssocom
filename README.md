# Fssocom Inventory - Modern Inventory Management System

A professional offline-first desktop inventory management application with location-based filtering, barcode generation, and planned cloud synchronization.

**Status**: ✅ Production-ready with enterprise auto-update CI/CD system

## 📖 Documentation

- **[SETUP_COMPLETE.md](./SETUP_COMPLETE.md)** - Quick overview of what's ready
- **[QUICK_RELEASE.md](./QUICK_RELEASE.md)** - 30-second release guide for developers
- **[RELEASE_PROCESS.md](./RELEASE_PROCESS.md)** - Full detailed guide with troubleshooting
- **[CI_CD_EXPLANATION.md](./CI_CD_EXPLANATION.md)** - Technical explanation of auto-update system

## Features

- **Modern Design** - Clean, professional UI with dark gray sidebar, teal/emerald accents, and rounded container layout
- **Offline-First Architecture** - Local SQLite database with planned Supabase cloud sync
- **Location-Based Management** - Color-coded location badges with automatic consistent coloring and location filtering
- **Barcode Generation** - Auto-generate unique 13-digit EAN-13 barcodes with duplicate checking
- **Barcode Scanner Support** - USB barcode scanner integration (keyboard wedge type)
- **User Management** - Role-based access control (Admin/User)
- **Stock Management** - Track inventory by location with customer/dealer pricing
- **Transaction History** - Complete audit trail of all inventory changes
- **Planned C# Printing Service** - Thermal barcode label printing and invoice PDF generation
- **Cross-Platform** - Windows desktop application built with Electron

## Key Features Details

### Location-Based Inventory
- **Auto-assigned colors**: Each location gets a consistent color from a 10-color palette (blue, emerald, purple, pink, orange, teal, cyan, indigo, rose, amber)
- **Location filter**: Quick dropdown to filter inventory by specific location
- **Default sorting**: Items sorted by location alphabetically, then by item name
- **Color-coded badges**: Visual differentiation makes scanning easier

### Barcode Management
- **Auto-generation**: Unique 13-digit EAN-13 codes starting with "2"
- **Duplicate checking**: Ensures no barcode collisions (max 100 generation attempts)
- **Manual regeneration**: Button to generate new barcode if needed
- **Scanner ready**: Works with USB keyboard wedge barcode scanners

### Pricing Structure
- **Customer Price**: Retail/customer-facing price
- **Dealer Price**: Wholesale/dealer cost price
- **Price visibility**: Both prices displayed in inventory table for quick reference

### Design
- **Dark sidebar**: Gray-800 background with emerald-500 active states
- **Rounded container**: Clean white content area with shadow and rounded corners
- **Teal/emerald theme**: Consistent color scheme throughout (#10b981)
- **User profile**: Sidebar shows current user with avatar and role

## Default Credentials

- Username: `admin`
- Password: `admin123`

## Installation

### For End Users

1. Download the latest release from the [Releases page](https://github.com/YOUR_USERNAME/fssocom-inventory/releases)
2. Run the installer (`Fssocom Setup x.x.x.exe`) or portable version
3. If Windows SmartScreen shows a warning, click "More info" → "Run anyway"
4. The app will automatically check for updates on startup

### For Developers

1. Clone the repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/fssocom-inventory.git
   cd fssocom-inventory
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run in development mode:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## Release & Auto-Updates

### For Developers: Zero-Setup Release Process

No local setup needed! GitHub Actions handles everything automatically.

**To release a new version:**

```bash
# 1. Edit package.json and change version
# "version": "1.0.2"

# 2. Commit and push
git add package.json
git commit -m "Release: v1.0.2"
git push origin main

# 3. Create a tag (this triggers GitHub Actions to build!)
git tag v1.0.2
git push origin v1.0.2
```

**GitHub Actions will automatically:**
- ✅ Build the app on Windows Server in the cloud
- ✅ Create installer and portable versions
- ✅ Publish to GitHub Releases
- ✅ Generate `latest.yml` for auto-updates

**See [QUICK_RELEASE.md](./QUICK_RELEASE.md) for detailed guide**

### For End Users: Automatic Updates

1. Install Fssocom from [GitHub Releases](https://github.com/YOUR_USERNAME/fssocom-inventory/releases)
2. App automatically checks for updates on startup
3. If new version exists, user gets a notification
4. Click "Update Now" → App updates and restarts
5. Done! No manual download/installation needed

## Current Architecture

### Database
- **Local Storage**: SQLite database at `%APPDATA%/fssocom-inventory/inventory.db`
- **Schema**:
  - `users` - User accounts with roles (admin/user)
  - `inventory` - Items with location, customer_price, dealer_price, barcode, SKU, category, quantity, supplier
  - `transactions` - Audit trail of all stock changes
- **Supabase**: SDK installed (`@supabase/supabase-js`) but sync not yet implemented

### Inventory Table Columns (in order)
1. **Location** - Warehouse/storage location with color-coded badge
2. **Item Name** - Product name
3. **Customer Price** - Retail price
4. **Dealer Price** - Wholesale/cost price
5. **SKU/Barcode** - Stock keeping unit and barcode number
6. **Category** - Product category
7. **Quantity** - Current stock level
8. **Actions** - Edit/Delete buttons

## Roadmap

### ✅ Completed
- [x] Modern UI design with dark sidebar and teal theme
- [x] Location-based filtering with color-coded badges
- [x] Barcode generation (13-digit EAN-13 with duplicate checking)
- [x] Customer/Dealer price fields
- [x] Offline-first local SQLite database
- [x] User authentication and role management
- [x] Transaction history tracking
- [x] Branding updated to "Fssocom" with logo

### 🚧 In Progress
- [ ] Preparing GitHub repository

### 📋 Planned
- [ ] **Supabase Cloud Sync**
  - Online/offline detection
  - Real-time synchronization
  - Conflict resolution
  - Queue system for offline changes
  - Status indicator in UI

- [ ] **C# Printing Service**
  - Barcode label printing (Zebra/thermal printers with ZPL)
  - Invoice PDF generation and printing
  - IPC/REST communication bridge with Electron app
  - Windows Print Spooler integration

- [ ] **Update Remaining Pages**
  - Dashboard analytics page
  - Barcode scanner page redesign
  - Transactions page styling
  - Users management page
  - Settings page

- [ ] **Production Build & Distribution**
  - ✅ GitHub Actions CI/CD for auto-building
  - ✅ Auto-update functionality via GitHub Releases
  - Code signing for Windows (optional paid feature)

## Setting Up Supabase Backend (Not Yet Implemented)

The app currently uses only local SQLite database. Supabase SDK is installed but sync is not yet implemented. To enable cloud sync in the future:

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up
2. Create a new project
3. Wait for the database to initialize

### 2. Run Database Schema

1. In Supabase dashboard, go to SQL Editor
2. Copy the schema from `src/lib/supabaseConfig.js` (the commented SQL section)
3. Run the SQL to create tables

### 3. Get API Credentials

1. Go to Project Settings → API
2. Copy:
   - Project URL (e.g., `https://xxxxx.supabase.co`)
   - `anon` public key

### 4. Update Configuration

Edit `src/lib/supabaseConfig.js`:

```javascript
const supabaseUrl = 'https://YOUR_PROJECT.supabase.co'
const supabaseKey = 'your-anon-key-here'
```

### 5. Implement Supabase Integration (TODO)

The configuration setup will be needed:
- Create offline/online detection system
- Implement real-time sync logic between local SQLite and Supabase
- Add conflict resolution for simultaneous edits
- Create queue system for offline changes
- Add online/offline status indicator in UI
- Replace or supplement `electron/main.cjs` database calls with Supabase API
- Consider hybrid approach: always use local SQLite, sync in background

## Barcode Features

### Barcode Generation
The app auto-generates unique 13-digit EAN-13 barcodes:
- Format: Starts with "2" (reserved for internal use)
- Length: 13 digits total
- Duplicate checking: Scans existing barcodes to prevent collisions
- Max attempts: 100 generation tries before failure
- Auto-generate: New barcode created when adding items
- Manual regenerate: Button available in the form

### Barcode Scanner Support

The app supports USB barcode scanners (keyboard wedge type):

1. Connect your USB barcode scanner
2. Go to the "Barcode Scanner" page
3. Focus the input field
4. Scan a barcode - it will automatically search and display the item
5. Add/remove stock directly from the scanner interface

**Note:** Camera-based scanning has been removed. Only USB hardware scanners are supported.

## C# Printing Service (Planned)

A separate C# Windows service is planned for professional printing capabilities:

### Why C# Instead of Electron?
- **Better Windows Integration**: Native access to Windows Print Spooler and printer drivers
- **Thermal Printer Support**: Direct ZPL (Zebra Programming Language) commands for barcode label printers
- **Performance**: C# handles PDF generation and print jobs more efficiently
- **Separation of Concerns**: Electron focuses on UI/sync, C# handles printing

### Planned Features
- **Barcode Label Printing**:
  - Support for Zebra, Brother, and other thermal printers
  - Custom label templates (30mm x 20mm, 50mm x 30mm, etc.)
  - Direct ZPL command generation
  - Batch printing support

- **Invoice Printing**:
  - PDF generation with company branding
  - Multiple invoice templates
  - Print preview before printing
  - Save PDF option

- **Communication Bridge**:
  - Options: IPC via named pipes, REST API, or shared SQLite queue
  - Electron sends print requests to C# service
  - C# returns status updates (printing, completed, error)

### Implementation Plan
1. Create C# Windows Service or Console App
2. Choose communication method (likely REST API on localhost)
3. Implement ZPL template system for barcode labels
4. Add PDF generation library (iTextSharp or similar)
5. Integrate with Electron app via IPC
6. Package both apps together in installer

## Building for Production

### Windows

```bash
npm run build
```

Output files in `dist-electron/`:
- `Fssocom Setup x.x.x.exe` - Installer (NSIS)
- `Fssocom-Portable.exe` - Portable version

### Code Signing

The app is currently signed with a self-signed certificate, which still triggers Windows SmartScreen warnings. Options:

1. **Free (current)**: Self-signed certificate - users must click "More info" → "Run anyway"
2. **Paid ($100-400/year)**: Commercial code signing certificate from DigiCert, GlobalSign, etc.

To use your own certificate:

1. Get a code signing certificate (.pfx file)
2. Update `package.json` electron-builder config:
   ```json
   "win": {
     "certificateFile": "path/to/your/certificate.pfx",
     "certificatePassword": "your-password"
   }
   ```

## Project Structure

```
fssocom-inventory/
├── electron/
│   ├── main.cjs           # Main process (IPC, SQLite database, window management)
│   └── preload.cjs        # Preload script (IPC bridge to renderer)
├── src/
│   ├── components/
│   │   ├── TitleBar.jsx   # Custom window titlebar with Fssocom logo
│   │   └── Sidebar.jsx    # Dark navigation sidebar with user profile
│   ├── pages/
│   │   ├── LoginPage.jsx          # Login with Fssocom branding
│   │   ├── DashboardPage.jsx      # Analytics dashboard (needs update)
│   │   ├── InventoryPage.jsx      # Main inventory with location filtering ✅
│   │   ├── BarcodePage.jsx        # Barcode scanner interface (needs update)
│   │   ├── TransactionsPage.jsx   # Transaction history (needs update)
│   │   ├── UsersPage.jsx          # User management (needs update)
│   │   └── SettingsPage.jsx       # App settings (needs update)
│   ├── lib/
│   │   ├── api.js              # API wrapper for IPC calls to main process
│   │   └── supabaseConfig.js   # Supabase config (not yet implemented)
│   ├── assets/
│   │   ├── FSSOAppLogo.png     # Main logo (28x28)
│   │   └── Fssocomlogo.png     # Text logo
│   ├── App.jsx             # Main app with routing and layout
│   └── index.css           # Global styles with teal/emerald theme
├── public/
│   ├── icon.png            # Taskbar icon (FSSOAppLogo copy)
│   └── favicon.png         # Browser favicon (FSSOAppLogo copy)
├── package.json            # Updated to fssocom-inventory
├── vite.config.js
└── README.md
```

## Database Location

- **SQLite** (current): `%APPDATA%/fssocom-inventory/inventory.db`
- **Supabase** (planned): Cloud sync not yet implemented

### Database Schema

**users**
- id, username, password (hashed), role (admin/user), created_at

**inventory**
- id, name, sku, barcode, category, quantity
- location (warehouse/storage location)
- customer_price (retail price)
- dealer_price (wholesale/cost price)
- supplier, description, created_at, updated_at

**transactions**
- id, inventory_id, user_id, type (add/remove/adjust)
- quantity_change, new_quantity, reason, created_at

## Tech Stack

- **Frontend**: React 19, Vite 6
- **Desktop Framework**: Electron 34
- **Database**: 
  - Local: SQLite 3 with better-sqlite3
  - Cloud (planned): Supabase PostgreSQL
- **Styling**: Tailwind CSS utility classes with custom teal/emerald theme
- **Icons**: Lucide React icons
- **Barcode**: JsBarcode library for EAN-13 generation
- **Build**: electron-builder (NSIS installer for Windows)
- **Future**: C# .NET for printing service

## Development Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production (Windows)
- `npm run release` - Build and publish to GitHub Releases
- `npm run preview` - Preview production build

## Troubleshooting

### "GH_TOKEN not found" error
Make sure you've set the `GH_TOKEN` environment variable and restarted your terminal/IDE.

### Auto-updates not working
- Ensure repository is **public** (GitHub API limitations for private repos)
- Check that `latest.yml` exists in the GitHub release
- Verify `package.json` repository URL matches your GitHub repo

### Windows SmartScreen warning
This is expected with self-signed certificates. Users must click "More info" → "Run anyway". Purchase a commercial code signing certificate to eliminate this warning.

### Build fails with "winCodeSign" error
This is handled automatically by setting `signAndEditExecutable: false` in package.json. If it persists, ensure you're running PowerShell as administrator or disable code signing temporarily:
```json
"win": {
  "certificateFile": null
}
```

## License

MIT

## Support

For issues and feature requests, please use the [GitHub Issues](https://github.com/YOUR_USERNAME/fssocom-inventory/issues) page.

## Screenshots

### Inventory Page
- Location-based filtering with color-coded badges
- Customer/Dealer pricing columns
- Auto-generated barcodes
- Clean teal/emerald theme with dark sidebar

### Design Features
- Dark gray-800 sidebar with user profile
- Rounded white content container
- Teal/emerald accent colors (#10b981)
- Consistent color assignment for locations
- Search and filter capabilities

## Contributors

Developed for FSSO inventory management needs.

## Version

Current: 1.0.0 (Development)
- Offline-first SQLite implementation
- Modern UI with location-based features
- Barcode generation system
- Local user authentication

Next: 1.1.0 (Planned)
- Supabase cloud sync
- C# printing service integration
- Auto-update system
