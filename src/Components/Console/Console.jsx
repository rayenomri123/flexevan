import { useState, useEffect } from 'react';
import './Console.css';

const Console = ({ isRunning }) => {
  const [dhcpLogs, setDhcpLogs] = useState([]);
  const [udsLogs, setUdsLogs] = useState({}); // { [mac]: [logs] }
  const [devices, setDevices] = useState([]); // [{ ip, mac, port }]

  // Fetch DHCP logs and listen for real-time updates
  useEffect(() => {
    if (isRunning) {
      window.electronAPI.getDhcpLogs()
        .then(logs => {
          setDhcpLogs(logs);
        })
        .catch(err => {
          setDhcpLogs(prev => [
            ...prev,
            {
              timestamp: new Date().toISOString(),
              message: `Error fetching DHCP logs: ${err.message}`,
              level: 'error'
            }
          ]);
        });

      const handleDhcpLog = (log) => {
        setDhcpLogs(prev => [...prev, log]);
      };
      window.electronAPI.onDhcpLog(handleDhcpLog);

      return () => {};
    }
  }, [isRunning]);

  // Listen for device connections
  useEffect(() => {
    if (isRunning) {
      const handleDeviceConnected = (device) => {
        console.log('device-connected event received:', device); // Debug log
        if (device && device.ip && device.mac && device.port) {
          setDevices(prev => {
            if (!prev.some(d => d.mac === device.mac)) {
              console.log('Adding device:', device); // Debug log
              return [...prev, device];
            }
            return prev;
          });
        } else {
          setDhcpLogs(prev => [
            ...prev,
            {
              timestamp: new Date().toISOString(),
              message: `Invalid device-connected event data: ${JSON.stringify(device)}`,
              level: 'error'
            }
          ]);
        }
      };
      window.electronAPI.on('device-connected', handleDeviceConnected);

      return () => {};
    }
  }, [isRunning]);

  // Fetch UDS logs for each device periodically
  useEffect(() => {
    if (isRunning && devices.length > 0) {
      const fetchUdsLogs = () => {
        console.log('Fetching UDS logs for devices:', devices); // Debug log
        devices.forEach(device => {
          if (!device.ip || !device.port || !device.mac) {
            setUdsLogs(prev => ({
              ...prev,
              [device.mac || 'unknown']: [
                ...(prev[device.mac || 'unknown'] || []),
                {
                  timestamp: new Date().toISOString(),
                  message: `Invalid device data for MAC ${device.mac || 'unknown'}: missing ip or port`,
                  level: 'error'
                }
              ]
            }));
            return;
          }

          fetch(`http://${device.ip}:${device.port}/uds_logs`)
            .then(res => {
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              return res.json();
            })
            .then(logs => {
              setUdsLogs(prev => ({ ...prev, [device.mac]: logs }));
            })
            .catch(err => {
              setUdsLogs(prev => ({
                ...prev,
                [device.mac]: [
                  ...(prev[device.mac] || []),
                  {
                    timestamp: new Date().toISOString(),
                    message: `Error fetching UDS logs for ${device.mac}: ${err.message}`,
                    level: 'error'
                  }
                ]
              }));
            });
        });
      };

      fetchUdsLogs();
      const interval = setInterval(fetchUdsLogs, 5000);

      return () => clearInterval(interval);
    }
  }, [isRunning, devices]);

  // Combine and sort all logs
  const allLogs = [
    ...dhcpLogs.map(log => ({ ...log, source: 'DHCP' })),
    ...Object.entries(udsLogs).flatMap(([mac, logs]) =>
      logs.map(log => ({ ...log, source: `UDS (${mac})` }))
    )
  ]
  .filter(log => log.level === 'info')
  .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  return (
    <div className="console-container">
      {isRunning && (
        <div className="console-messages">
          {allLogs.map((log, index) => (
            <div key={index} className={`console-message console-${log.level}`}>
              <span className="timestamp">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>{' '}
              [{log.source} {log.level.toUpperCase()}] {log.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Console;