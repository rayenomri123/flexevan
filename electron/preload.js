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
});