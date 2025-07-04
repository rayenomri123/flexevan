const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
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

// Request elevation on Windows
if (process.platform === 'win32' && !process.env.HOME) {
  const { spawn } = require('child_process');
  spawn('powershell.exe', [
    'Start-Process',
    process.execPath,
    '-Verb',
    'RunAs'
  ], { detached: true });
  app.quit();
  return;
}

// IPC handler to get network interfaces
ipcMain.handle('get-network-interfaces', async () => {
  const interfaces = os.networkInterfaces();
  const ethernetInterfacesMap = new Map();

  Object.keys(interfaces).forEach((elix) => {
    if (elix.match(/^(eth|en|Ethernet)/i)) {
      const ipv4Details = interfaces[elix].find(details => details.family === 'IPv4' && !details.internal);
      if (ipv4Details) {
        ethernetInterfacesMap.set(elix, {
          name: elix,
          address: ipv4Details.address,
        });
      }
    }
  });

  const ethernetInterfaces = Array.from(ethernetInterfacesMap.values());

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
    const existing = db.prepare('SELECT id FROM settings ORDER BY id DESC LIMIT 1').get();
    const id = existing ? existing.id : 1; // Use 1 if no settings exist
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO settings (
        id, interface_name, host_ip, subnet_mask, pool_start, pool_end, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    stmt.run(
      id,
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

// Helper function to validate IP against subnet
function isIpInSubnet(ip, subnetIp, subnetMask) {
  const ipParts = ip.split('.').map(Number);
  const subnetParts = subnetIp.split('.').map(Number);
  const maskParts = subnetMask.split('.').map(Number);

  for (let i = 0; i < 4; i++) {
    if ((ipParts[i] & maskParts[i]) !== (subnetParts[i] & maskParts[i])) {
      return false;
    }
  }
  return true;
}

// Helper function to calculate CIDR prefix from subnet mask
function maskToCidr(subnetMask) {
  const maskParts = subnetMask.split('.').map(Number);
  let cidr = 0;
  for (const part of maskParts) {
    let bits = 0;
    let n = part;
    while (n) {
      bits += n & 1;
      n >>= 1;
    }
    cidr += bits;
  }
  return cidr;
}

// Helper function to calculate broadcast address
function calculateBroadcast(ip, subnetMask) {
  const ipParts = ip.split('.').map(Number);
  const maskParts = subnetMask.split('.').map(Number);
  const broadcast = ipParts.map((part, i) => part | (~maskParts[i] & 255));
  return broadcast.join('.');
}

// IPC handler to start the DHCP server
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

    // Validate settings
    if (!settings.interface_name || !settings.host_ip || !settings.subnet_mask || !settings.pool_start || !settings.pool_end) {
      throw new Error('Incomplete DHCP settings');
    }

    // Validate IP against interface subnet
    const interfaceDetails = os.networkInterfaces()[settings.interface_name];
    if (!interfaceDetails) {
      throw new Error(`Interface ${settings.interface_name} not found`);
    }
    const interfaceIp = interfaceDetails.find(details => details.family === 'IPv4' && !details.internal)?.address;
    if (!interfaceIp) {
      throw new Error(`No valid IPv4 address found for ${settings.interface_name}`);
    }
    if (!isIpInSubnet(settings.host_ip, interfaceIp, settings.subnet_mask)) {
      throw new Error(`Host IP ${settings.host_ip} is not in the subnet of ${interfaceIp}/${settings.subnet_mask}`);
    }

    // Assign custom IP to interface
    const cidr = maskToCidr(settings.subnet_mask);
    try {
      if (process.platform === 'linux') {
        // Check if IP is already assigned
        const ipList = execSync(`ip addr show ${settings.interface_name}`).toString();
        if (!ipList.includes(settings.host_ip)) {
          execSync(`ip addr add ${settings.host_ip}/${cidr} dev ${settings.interface_name}`);
        }
      } else if (process.platform === 'win32') {
        // Check if IP is already assigned
        const ipConfig = execSync(`netsh interface ip show address "${settings.interface_name}"`).toString();
        if (!ipConfig.includes(settings.host_ip)) {
          execSync(`netsh interface ip add address "${settings.interface_name}" ${settings.host_ip} ${settings.subnet_mask}`);
        }
      } else {
        throw new Error(`Unsupported platform: ${process.platform}`);
      }
    } catch (ipError) {
      console.error('Error assigning IP to interface:', ipError);
      throw new Error(`Failed to assign IP ${settings.host_ip} to ${settings.interface_name}: ${ipError.message}`);
    }

    const options = {
      range: [settings.pool_start, settings.pool_end],
      netmask: settings.subnet_mask,
      router: [settings.host_ip],
      server: settings.host_ip,
      broadcast: calculateBroadcast(settings.host_ip, settings.subnet_mask),
      interface: settings.interface_name // Specify interface if supported
    };

    server = dhcp.createServer(options);
    server.on('listening', () => {
      console.log('DHCP Server started with host IP:', settings.host_ip);
      BrowserWindow.getAllWindows()[0].webContents.send('dhcp-status', {
        status: 'running',
        boundAddress: settings.host_ip
      });
    });
    server.on('error', (err) => {
      console.error('DHCP Server error:', err);
      BrowserWindow.getAllWindows()[0].webContents.send('dhcp-status', {
        status: 'error',
        error: err.message
      });
    });
    server.on('dhcpRequest', (data) => {
      console.log('DHCP Request received:', data);
    });
    server.listen();
    return 'DHCP server started successfully';
  } catch (error) {
    console.error('Error starting DHCP server:', error);
    throw error;
  }
});

// IPC handler to stop the DHCP server
ipcMain.handle('stop-dhcp', async () => {
  if (!server) {
    throw new Error('DHCP server is not running');
  }
  try {
    const db = getDb();
    const settings = db.prepare('SELECT * FROM settings ORDER BY id DESC LIMIT 1').get();
    
    server.close();
    server = null;

    // Remove custom IP from interface
    try {
      const cidr = maskToCidr(settings.subnet_mask);
      if (process.platform === 'linux') {
        execSync(`ip addr del ${settings.host_ip}/${cidr} dev ${settings.interface_name}`);
      } else if (process.platform === 'win32') {
        execSync(`netsh interface ip delete address "${settings.interface_name}" ${settings.host_ip}`);
      }
    } catch (ipError) {
      console.error('Error removing IP from interface:', ipError);
    }

    console.log('DHCP server stopped');
    return 'DHCP server stopped successfully';
  } catch (error) {
    console.error('Error stopping DHCP server:', error);
    throw error;
  }
});

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
    server.close();
    console.log('DHCP server stopped');
  }
  if (process.platform !== 'darwin') app.quit();
});