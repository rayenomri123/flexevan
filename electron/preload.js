const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getNetworkInterfaces: () => ipcRenderer.invoke('get-network-interfaces'),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  startDhcp: () => ipcRenderer.invoke('start-dhcp'),
  stopDhcp: () => ipcRenderer.invoke('stop-dhcp'),
  quitApp: () => ipcRenderer.invoke('quit-app'),
  fetchReports: () => ipcRenderer.invoke('fetch-reports'),
  addReport: (report) => ipcRenderer.invoke('add-report', report),
  searchReports: (query) => ipcRenderer.invoke('search-reports', query),
  fetchUsers: () => ipcRenderer.invoke('fetch-users'),
  updateUserLoggedIn: (userData) => ipcRenderer.invoke('update-user-loggedin', userData),
  getDhcpLogs: () => ipcRenderer.invoke('get-dhcp-logs'),
  onDhcpLog: (callback) => ipcRenderer.on('dhcp-log', (event, log) => callback(log)),
  on: (channel, callback) => ipcRenderer.on(channel, (event, ...args) => callback(...args)),
});