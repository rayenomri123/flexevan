const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const os = require('os');
const { initDatabase, getDb } = require('./database');
const dhcp = require('dhcp');

let server; // Store the DHCP server instance

function createWindow() {
  const win = new BrowserWindow({
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
    },
  });

  win.maximize();

  const isDev = process.env.NODE_ENV !== 'production';
  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

// IPC handler to get network interfaces
ipcMain.handle('get-network-interfaces', async () => {
  const interfaces = os.networkInterfaces();
  const ethernetInterfaces = [];

  Object.keys(interfaces).forEach((elix) => {
    interfaces[elix].forEach((details) => {
      if (details.family === 'IPv4' && !details.internal && elix.match(/^(eth|en|Ethernet)/i)) {
        ethernetInterfaces.push({
          name: elix,
          address: details.address,
        });
      }
    });
  });

  return ethernetInterfaces.length > 0
    ? ethernetInterfaces
    : [{ name: 'Interface', address: 'not found' }];
});

// IPC handler to get settings
ipcMain.handle('get-settings', async () => {
  try {
    const db = getDb();
    const row = db.prepare('SELECT * FROM settings ORDER BY id DESC LIMIT 1').get();
    return row || null;
  } catch (error) {
    console.error('Error fetching settings:', error);
    throw error;
  }
});

// IPC handler to save settings
ipcMain.handle('save-settings', async (event, settings) => {
  try {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO settings (
        id, interface_name, host_ip, subnet_mask, pool_start, pool_end, updated_at
      ) VALUES (
        (SELECT id FROM settings ORDER BY id DESC LIMIT 1),
        ?, ?, ?, ?, ?, CURRENT_TIMESTAMP
      )
    `);
    stmt.run(
      settings.interface_name,
      settings.host_ip,
      settings.subnet_mask,
      settings.pool_start,
      settings.pool_end
    );
  } catch (error) {
    console.error('Error saving settings:', error);
    throw error;
  }
});

// New IPC handler to start the DHCP server
ipcMain.handle('start-dhcp', async () => {
  if (server) {
    throw new Error('DHCP server is already running');
  }
  try {
    const db = getDb();
    const settings = db.prepare('SELECT * FROM settings ORDER BY id DESC LIMIT 1').get();
    if (!settings) {
      throw new Error('No settings found in the database');
    }

    // Validate settings (basic example)
    if (!settings.interface_name || !settings.host_ip || !settings.subnet_mask || !settings.pool_start || !settings.pool_end) {
      throw new Error('Incomplete DHCP settings');
    }

    const options = {
      range: [settings.pool_start, settings.pool_end], // IP address pool
      netmask: settings.subnet_mask,                   // Subnet mask
      router: [settings.host_ip],                     // Default gateway
      server: settings.host_ip,                       // DHCP server IP
      broadcast: calculateBroadcast(settings.host_ip, settings.subnet_mask), // Calculate broadcast address
    };

    server = dhcp.createServer(options);
    server.listen(); // Start the DHCP server
    console.log(`DHCP server started on ${settings.host_ip} with range ${settings.pool_start}-${settings.pool_end}`);
    return 'DHCP server started successfully';
  } catch (error) {
    console.error('Error starting DHCP server:', error);
    throw error;
  }
});

ipcMain.handle('stop-dhcp', async () => {
  if (!server) {
    throw new Error('DHCP server is not running');
  }
  try {
    server.close();
    server = null;
    console.log('DHCP server stopped');
    return 'DHCP server stopped successfully';
  } catch (error) {
    console.error('Error stopping DHCP server:', error);
    throw error;
  }
});

// Helper function to calculate broadcast address
function calculateBroadcast(ip, subnetMask) {
  const ipParts = ip.split('.').map(Number);
  const maskParts = subnetMask.split('.').map(Number);
  const broadcast = ipParts.map((part, i) => part | (~maskParts[i] & 255));
  return broadcast.join('.');
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  initDatabase();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (server) {
    server.close(); // Stop the DHCP server
    console.log('DHCP server stopped');
  }
  if (process.platform !== 'darwin') app.quit();
});