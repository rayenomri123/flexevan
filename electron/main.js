const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const os = require('os');
const { execSync, spawn } = require('child_process');
const { initDatabase, getDb } = require('./database');
const dhcp = require('dhcp');

const dhcpLogs = [];
let mainWindow = null; // Store main window reference
let server; // Store the DHCP server instance
let nextPort = 5000;
const devicePorts = new Map(); // Maps MAC address to Flask port

function addDhcpLog(message, level = 'info') {
  const log = {
    timestamp: new Date().toISOString(),
    message,
    level,
  };
  dhcpLogs.push(log);
  if (dhcpLogs.length > 1000) {
    dhcpLogs.shift();
  }
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('dhcp-log', log);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
    },
  });

  mainWindow.maximize();

  const isDev = process.env.NODE_ENV !== 'production';
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
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

// IPC handler to get DHCP logs
ipcMain.handle('get-dhcp-logs', async () => {
  return dhcpLogs;
});

// IPC handler to get settings
ipcMain.handle('get-settings', async () => {
  try {
    const db = getDb();
    const row = db.prepare('SELECT * FROM settings ORDER BY id DESC LIMIT 1').get();
    return row || null;
  } catch (error) {
    addDhcpLog(`Error fetching settings: ${error.message}`, 'error');
    throw error;
  }
});

// IPC handler to save settings
ipcMain.handle('save-settings', async (event, settings) => {
  try {
    const db = getDb();
    const existing = db.prepare('SELECT id FROM settings ORDER BY id DESC LIMIT 1').get();
    const id = existing ? existing.id : 1;
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
    return 'Settings saved successfully';
  } catch (error) {
    addDhcpLog(`Error saving settings: ${error.message}`, 'error');
    throw error;
  }
});

// IPC handler to fetch all reports
ipcMain.handle('fetch-reports', async () => {
  try {
    const db = getDb();
    const reports = db.prepare(`
      SELECT id, title, vehicle_identification_number, ecu_serial_number_data_identifier,
             system_supplier_identifier, vehicle_manufacturer_ecu_hardware_number,
             manufacturer_spare_part_number, created_at
      FROM reports
      ORDER BY created_at DESC
    `).all();
    return reports;
  } catch (error) {
    addDhcpLog(`Error fetching reports: ${error.message}`, 'error');
    throw error;
  }
});

// IPC handler to add a new report
ipcMain.handle('add-report', async (event, report) => {
  try {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO reports (
        title, vehicle_identification_number, ecu_serial_number_data_identifier,
        system_supplier_identifier, vehicle_manufacturer_ecu_hardware_number,
        manufacturer_spare_part_number
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      report.title,
      report.vehicle_identification_number,
      report.ecu_serial_number_data_identifier,
      report.system_supplier_identifier,
      report.vehicle_manufacturer_ecu_hardware_number,
      report.manufacturer_spare_part_number
    );
    return { id: result.lastInsertRowid, ...report, created_at: new Date().toISOString() };
  } catch (error) {
    addDhcpLog(`Error adding report: ${error.message}`, 'error');
    throw error;
  }
});

// IPC handler for FTS search by title
ipcMain.handle('search-reports', async (event, query) => {
  try {
    const db = getDb();
    const sanitized = query
      .replace(/[^A-Za-z0-9 ]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!sanitized) {
      return [];
    }

    const ftsQuery = sanitized
      .split(' ')
      .map(token => `${token}*`)
      .join(' AND ');

    const stmt = db.prepare(`
      SELECT
        r.id,
        r.title,
        r.vehicle_identification_number AS vin,
        r.ecu_serial_number_data_identifier AS sn_di,
        r.system_supplier_identifier AS supplier_id,
        r.vehicle_manufacturer_ecu_hardware_number AS hw_number,
        r.manufacturer_spare_part_number AS part_number,
        r.created_at
      FROM reports_fts fts
      JOIN reports r ON fts.rowid = r.id
      WHERE fts.title MATCH ?
      ORDER BY rank;
    `);
    const reports = stmt.all(ftsQuery);
    return reports;
  } catch (error) {
    addDhcpLog(`Error searching reports: ${error.message}`, 'error');
    throw error;
  }
});

// IPC handler to fetch all users
ipcMain.handle('fetch-users', async () => {
  try {
    const db = getDb();
    const users = db.prepare('SELECT id, username, password, loggedin FROM users').all();
    return users;
  } catch (error) {
    addDhcpLog(`Error fetching users: ${error.message}`, 'error');
    throw error;
  }
});

// IPC handler to update loggedin status
ipcMain.handle('update-user-loggedin', async (event, { id, loggedin }) => {
  try {
    const db = getDb();
    const stmt = db.prepare('UPDATE users SET loggedin = ? WHERE id = ?');
    stmt.run(loggedin, id);
    return { success: true, id, loggedin };
  } catch (error) {
    addDhcpLog(`Error updating user loggedin status: ${error.message}`, 'error');
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
      devicePorts.clear();
      const db = getDb();
      const settings = db.prepare('SELECT * FROM settings ORDER BY id DESC LIMIT 1').get();
      if (settings) {
        const cidr = maskToCidr(settings.subnet_mask);
        if (process.platform === 'linux') {
          execSync(`ip addr del ${settings.host_ip}/${cidr} dev ${settings.interface_name}`);
          addDhcpLog(`Removed IP ${settings.host_ip}/${cidr} from ${settings.interface_name}`);
        } else if (process.platform === 'win32') {
          execSync(`netsh interface ip delete address "${settings.interface_name}" ${settings.host_ip}`);
          addDhcpLog(`Removed IP ${settings.host_ip} from ${settings.interface_name}`);
        }
      }
      addDhcpLog('DHCP server stopped');
    } catch (error) {
      addDhcpLog(`Error closing DHCP server: ${error.message}`, 'error');
    }
  }
}

// IPC handler to start the DHCP server
ipcMain.handle('start-dhcp', async () => {
  if (server) {
    const errorMsg = 'DHCP server is already running';
    addDhcpLog(errorMsg, 'error');
    throw new Error(errorMsg);
  }
  try {
    const db = getDb();
    const settings = db.prepare('SELECT * FROM settings ORDER BY id DESC LIMIT 1').get();
    if (!settings) {
      const errorMsg = 'No settings found in the database';
      addDhcpLog(errorMsg, 'error');
      throw new Error(errorMsg);
    }

    if (!settings.interface_name || !settings.host_ip || !settings.subnet_mask || !settings.pool_start || !settings.pool_end || !settings.logic_ad) {
      const errorMsg = 'Incomplete DHCP settings';
      addDhcpLog(errorMsg, 'error');
      throw new Error(errorMsg);
    }

    if (!isValidIp(settings.host_ip) || !isValidIp(settings.pool_start) || !isValidIp(settings.pool_end)) {
      const errorMsg = 'Invalid IP address format in settings';
      addDhcpLog(errorMsg, 'error');
      throw new Error(errorMsg);
    }

    if (!isIpInSubnet(settings.pool_start, settings.host_ip, settings.subnet_mask) || 
        !isIpInSubnet(settings.pool_end, settings.host_ip, settings.subnet_mask)) {
      const errorMsg = 'IP pool range is not within the subnet';
      addDhcpLog(errorMsg, 'error');
      throw new Error(errorMsg);
    }

    const interfaceDetails = os.networkInterfaces()[settings.interface_name];
    if (!interfaceDetails) {
      const errorMsg = `Interface ${settings.interface_name} not found`;
      addDhcpLog(errorMsg, 'error');
      throw new Error(errorMsg);
    }
    const interfaceIp = interfaceDetails.find(details => details.family === 'IPv4' && !details.internal)?.address;
    if (!interfaceIp) {
      const errorMsg = `No valid IPv4 address found for ${settings.interface_name}`;
      addDhcpLog(errorMsg, 'error');
      throw new Error(errorMsg);
    }

    const cidr = maskToCidr(settings.subnet_mask);
    try {
      if (process.platform === 'linux') {
        const ipList = execSync(`ip addr show ${settings.interface_name}`).toString();
        if (!ipList.includes(settings.host_ip)) {
          execSync(`ip addr add ${settings.host_ip}/${cidr} dev ${settings.interface_name}`);
          addDhcpLog(`Assigned IP ${settings.host_ip}/${cidr} to ${settings.interface_name}`);
        }
      } else if (process.platform === 'win32') {
        const ipConfig = execSync(`netsh interface ip show address "${settings.interface_name}"`).toString();
        if (!ipConfig.includes(settings.host_ip)) {
          execSync(`netsh interface ip add address "${settings.interface_name}" ${settings.host_ip} ${settings.subnet_mask}`);
          addDhcpLog(`Assigned IP ${settings.host_ip} to ${settings.interface_name}`);
        }
      } else {
        const errorMsg = `Unsupported platform: ${process.platform}`;
        addDhcpLog(errorMsg, 'error');
        throw new Error(errorMsg);
      }
    } catch (ipError) {
      const errorMsg = `Failed to assign IP ${settings.host_ip} to ${settings.interface_name}: ${ipError.message}`;
      addDhcpLog(errorMsg, 'error');
      throw new Error(ipError);
    }

    const options = {
      range: [settings.pool_start, settings.pool_end],
      netmask: settings.subnet_mask,
      router: [settings.host_ip],
      server: settings.host_ip,
      broadcast: calculateBroadcast(settings.host_ip, settings.subnet_mask),
      interface: settings.interface_name,
    };

    server = dhcp.createServer(options);
    server.on('listening', () => {
      addDhcpLog(`DHCP Server started with host IP: ${settings.host_ip}`);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('dhcp-status', {
          status: 'running',
          boundAddress: settings.host_ip
        });
      }
    });
    server.on('error', (err) => {
      addDhcpLog(`DHCP Server error: ${err.message}`, 'error');
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('dhcp-status', {
          status: 'error',
          error: err.message
        });
      }
    });
    server.on('bound', (state) => {
      const macAddress = Object.keys(state)[0];
      const deviceData = state[macAddress];
      if (!deviceData || !deviceData.address) {
        addDhcpLog(`Invalid device data in bound event: ${JSON.stringify(state)}`, 'error');
        return;
      }
      const ipAddress = deviceData.address;
      const chaddr = macAddress;

      addDhcpLog(`New device assigned IP: ${ipAddress} (MAC: ${chaddr})`);

      const db = getDb();
      const settings = db.prepare('SELECT logic_ad FROM settings ORDER BY id DESC LIMIT 1').get();
      if (!settings || !settings.logic_ad) {
        addDhcpLog('No logical address found in settings', 'error');
        return;
      }
      const logicalAddress = settings.logic_ad;

      const port = 5000;
      devicePorts.set(chaddr, port);

      const pythonScriptPath = path.join(__dirname, 'uds.py');
      const pythonProcess = spawn('python', [
        pythonScriptPath,
        '-i', ipAddress,
        '-l', logicalAddress,
        '-p', port.toString()
      ]);

      addDhcpLog(`Starting Diag Sequence...`);

      pythonProcess.stdout.on('data', (data) => {
        addDhcpLog(`uds.py stdout (MAC: ${chaddr}): ${data}`);
      });

      pythonProcess.stderr.on('data', (data) => {
        addDhcpLog(`uds.py stderr (MAC: ${chaddr}): ${data}`, 'error');
      });

      pythonProcess.on('close', (code) => {
        addDhcpLog(`uds.py process for MAC ${chaddr} exited with code ${code}`, code === 0 ? 'info' : 'error');
        if (code !== 0) {
          devicePorts.delete(chaddr);
        }
      });

      if (mainWindow && !mainWindow.isDestroyed()) {
        console.log('Emitting device-connected:', { ip: ipAddress, mac: chaddr, port });
        mainWindow.webContents.send('device-connected', {
          ip: ipAddress,
          mac: chaddr,
          port: port
        });
      }
    });
    server.listen();
    return 'DHCP server started successfully';
  } catch (error) {
    addDhcpLog(`Error starting DHCP server: ${error.message}`, 'error');
    throw error;
  }
});

// IPC handler to stop the DHCP server
ipcMain.handle('stop-dhcp', async () => {
  if (!server) {
    const errorMsg = 'DHCP server is not running';
    addDhcpLog(errorMsg, 'error');
    throw new Error(errorMsg);
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