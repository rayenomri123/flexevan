const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const os = require('os');
const { execSync, spawn } = require('child_process');
const { initDatabase, getDb } = require('./database');
const dhcp = require('dhcp');

let server; // Store the DHCP server instance

function createWindow() {
  const win = new BrowserWindow({
    frame: false, // Remove default title bar
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
        id, interface_name, host_ip, subnet_mask, pool_start, pool_end, logic_ad, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    stmt.run(
      id,
      settings.interface_name,
      settings.host_ip,
      settings.subnet_mask,
      settings.pool_start,
      settings.pool_end,
      settings.logic_ad
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

// Helper function to validate IP address
function isValidIp(ip) {
  const ipRegex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipRegex.test(ip);
}

// Helper function to validate MAC address
function isValidMac(mac) {
  const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
  return macRegex.test(mac);
}

// Function to close DHCP server if running
function closeDhcpServer() {
  if (server) {
    try {
      server.close();
      server = null;
      // Remove custom IP from interface
      const db = getDb();
      const settings = db.prepare('SELECT * FROM settings ORDER BY id DESC LIMIT 1').get();
      if (settings) {
        const cidr = maskToCidr(settings.subnet_mask);
        if (process.platform === 'linux') {
          execSync(`ip addr del ${settings.host_ip}/${cidr} dev ${settings.interface_name}`);
        } else if (process.platform === 'win32') {
          execSync(`netsh interface ip delete address "${settings.interface_name}" ${settings.host_ip}`);
        }
      }
      console.log('DHCP server stopped');
    } catch (error) {
      console.error('Error closing DHCP server:', error);
    }
  }
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
    if (!settings.interface_name || !settings.host_ip || !settings.subnet_mask || !settings.pool_start || !settings.pool_end || !settings.logic_ad) {
      throw new Error('Incomplete DHCP settings');
    }

    // Validate IP addresses
    if (!isValidIp(settings.host_ip) || !isValidIp(settings.pool_start) || !isValidIp(settings.pool_end)) {
      throw new Error('Invalid IP address format in settings');
    }

    // Validate IP pool is within subnet
    if (!isIpInSubnet(settings.pool_start, settings.host_ip, settings.subnet_mask) || 
        !isIpInSubnet(settings.pool_end, settings.host_ip, settings.subnet_mask)) {
      throw new Error('IP pool range is not within the subnet');
    }

    // Validate interface
    const interfaceDetails = os.networkInterfaces()[settings.interface_name];
    if (!interfaceDetails) {
      throw new Error(`Interface ${settings.interface_name} not found`);
    }
    const interfaceIp = interfaceDetails.find(details => details.family === 'IPv4' && !details.internal)?.address;
    if (!interfaceIp) {
      throw new Error(`No valid IPv4 address found for ${settings.interface_name}`);
    }

    // Assign custom IP to interface
    const cidr = maskToCidr(settings.subnet_mask);
    try {
      if (process.platform === 'linux') {
        const ipList = execSync(`ip addr show ${settings.interface_name}`).toString();
        if (!ipList.includes(settings.host_ip)) {
          execSync(`ip addr add ${settings.host_ip}/${cidr} dev ${settings.interface_name}`);
        }
      } else if (process.platform === 'win32') {
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
      interface: settings.interface_name
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
    server.on('bound', (state) => {
      // Log the full state for debugging
      console.log('Bound event state:', JSON.stringify(state, null, 2));

      // Extract the MAC address (first key in the state object)
      const macAddress = Object.keys(state)[0];
      if (!macAddress || !isValidMac(macAddress)) {
        console.error('Invalid bound event data: No valid MAC address found', state);
        return;
      }

      // Extract the device data
      const deviceData = state[macAddress];
      if (!deviceData || !deviceData.address || !isValidIp(deviceData.address)) {
        console.error('Invalid bound event data: Missing or invalid IP address', state);
        return;
      }

      const ipAddress = deviceData.address;
      const chaddr = macAddress;

      console.log(`New device assigned IP: ${ipAddress} (MAC: ${chaddr})`);

      // Get the logical address from the database
      const db = getDb();
      const settings = db.prepare('SELECT logic_ad FROM settings ORDER BY id DESC LIMIT 1').get();
      if (!settings || !settings.logic_ad) {
        console.error('No logical address found in settings');
        return;
      }
      const logicalAddress = settings.logic_ad;

      // Introduce a 20-second delay before running uds.py
      const delayInSeconds = 20;
      setTimeout(() => {
        // Run the uds.py script with the assigned IP and logical address
        const pythonScriptPath = path.join(__dirname, 'uds.py');
        const pythonProcess = spawn('python', [pythonScriptPath, '-i', ipAddress, '-l', logicalAddress]);

        pythonProcess.stdout.on('data', (data) => {
          console.log(`uds.py stdout: ${data}`);
        });

        pythonProcess.stderr.on('data', (data) => {
          console.error(`uds.py stderr: ${data}`);
        });

        pythonProcess.on('close', (code) => {
          console.log(`uds.py process exited with code ${code}`);
        });
      }, delayInSeconds * 1000);

      // Send IP to renderer immediately
      BrowserWindow.getAllWindows()[0].webContents.send('device-connected', {
        ip: ipAddress,
        mac: chaddr
      });
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
  closeDhcpServer();
  return 'DHCP server stopped successfully';
});

// IPC handler to quit the app
ipcMain.handle('quit-app', async () => {
  closeDhcpServer();
  app.quit();
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
  closeDhcpServer();
  if (process.platform !== 'darwin') app.quit();
});