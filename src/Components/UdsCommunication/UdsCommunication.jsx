// src/components/UdsCommunication.jsx
import React, { useState, useEffect } from 'react';

const UdsCommunication = () => {
  const [ip, setIp] = useState('');
  const [logicalAddress, setLogicalAddress] = useState('0x0501');
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load saved DHCP settings to prefill IP
  useEffect(() => {
    window.electronAPI.getSettings().then((settings) => {
      if (settings?.host_ip) {
        setIp(settings.host_ip);
      }
    }).catch((err) => {
      console.error('Failed to load settings:', err);
    });
  }, []);

  const handleUdsCommunication = async () => {
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const response = await window.electronAPI.performUdsCommunication({ ip, logicalAddress });
      setResults(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>UDS Communication</h2>
      <div>
        <label>
          Target IP:
          <input
            type="text"
            value={ip}
            onChange={(e) => setIp(e.target.value)}
            placeholder="e.g., 192.168.11.99"
          />
        </label>
      </div>
      <div>
        <label>
          Logical Address:
          <input
            type="text"
            value={logicalAddress}
            onChange={(e) => setLogicalAddress(e.target.value)}
            placeholder="e.g., 0x0501"
          />
        </label>
      </div>
      <button onClick={handleUdsCommunication} disabled={loading}>
        {loading ? 'Communicating...' : 'Perform UDS Communication'}
      </button>

      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {results.length > 0 && (
        <div>
          <h3>Results</h3>
          <ul>
            {results.map((result, index) => (
              <li key={index}>
                <strong>{result.description}</strong> ({result.did}):{' '}
                {result.status === 'success' ? (
                  <span style={{ color: 'green' }}>{result.payload}</span>
                ) : (
                  <span style={{ color: 'red' }}>Error: {result.error}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default UdsCommunication;