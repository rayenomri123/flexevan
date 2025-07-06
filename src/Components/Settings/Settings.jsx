import './Settings.css';
import { VscChevronRight, VscChevronDown, VscChevronUp, VscSaveAll } from 'react-icons/vsc';
import { CiServer } from 'react-icons/ci';
import { PiDevices } from 'react-icons/pi';
import { useState, useEffect, useRef } from 'react';

const Settings = () => {
  const [interfaces, setInterfaces] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isSCOpen, setIsSCOpen] = useState(true);
  const [isCCOpen, setIsCCOpen] = useState(false);
  const [settings, setSettings] = useState({
    interface_name: '',
    host_ip: '192.168.1.1',
    subnet_mask: '255.255.0.0',
    pool_start: '192.168.1.100',
    pool_end: '192.168.1.150',
    logic_ad: '0x00405F10'
  });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const interfacesData = await window.electronAPI.getNetworkInterfaces();
        setInterfaces(interfacesData);
        const settingsData = await window.electronAPI.getSettings();
        if (settingsData) setSettings(settingsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await window.electronAPI.saveSettings(settings);
      setMessage('Saved successfully!');
      setMessageType('success');
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('Error saving settings. Please try again.');
      setMessageType('error');
    }
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  const handleInterfaceSelect = (iface) => {
    setSettings(prev => ({ ...prev, interface_name: iface.name }));
    setDropdownOpen(false);
  };

  const selectedIface = interfaces.find(i => i.name === settings.interface_name);

  return (
    <div className='settings-container'>
      <div className="settings-container-left">
        <div
          className={`settings-container-left-btn-container ${isSCOpen ? 'active' : ''}`}
          onClick={() => { setIsSCOpen(true); setIsCCOpen(false); }}
        >
          <div className="settings-container-left-icon"><CiServer /></div>
          <button className="settings-container-left-btn">Server</button>
        </div>
        <div
          className={`settings-container-left-btn-container ${isCCOpen ? 'active' : ''}`}
          onClick={() => { setIsCCOpen(true); setIsSCOpen(false); }}
        >
          <div className="settings-container-left-icon"><PiDevices /></div>
          <button className="settings-container-left-btn">Client</button>
        </div>
      </div>

      <div className="settings-container-right">
        <div className="settings-container-title">
          {isSCOpen ? 'Server Configuration' : 'Client Configuration'}
        </div>

        <div className="conf-container">
          <form className="dhcp-form" onSubmit={handleSave}>
            {isSCOpen ? (
              <>
                <div className="form-group" ref={dropdownRef}>
                  <label>Interface / Adapter</label>
                  <div
                    className={`custom-dropdown ${dropdownOpen ? 'open' : ''}`}
                    onClick={() => !isLoading && setDropdownOpen(o => !o)}
                  >
                    <div className="dropdown-selected">
                      {isLoading
                        ? 'Loading interfaces...'
                        : selectedIface
                          ? `${selectedIface.name} (${selectedIface.address})`
                          : 'Select an interface'
                      }
                      {dropdownOpen ? <VscChevronUp className="dropdown-icon" /> : <VscChevronDown className="dropdown-icon" />}
                    </div>
                    <div className="dropdown-items">
                      {interfaces.map(iface => (
                        <div
                          key={iface.name}
                          className="dropdown-item"
                          onClick={() => handleInterfaceSelect(iface)}
                        >
                          {iface.name} ({iface.address})
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="hostIp">Host IP / Gateway IP</label>
                  <input
                    type="text"
                    id="hostIp"
                    name="host_ip"
                    value={settings.host_ip}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="subnetMask">Subnet Mask</label>
                  <input
                    type="text"
                    id="subnetMask"
                    name="subnet_mask"
                    value={settings.subnet_mask}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>Pool Range</label>
                  <div className="pool-range-inputs">
                    <input
                      type="text"
                      id="poolStart"
                      name="pool_start"
                      value={settings.pool_start}
                      onChange={handleInputChange}
                    />
                    <VscChevronRight className='right-chevron' />
                    <input
                      type="text"
                      id="poolEnd"
                      name="pool_end"
                      value={settings.pool_end}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="form-group">
                <label htmlFor="logic_ad">Logical Address</label>
                <input
                  type="text"
                  id="logic_ad"
                  name="logic_ad"
                  value={settings.logic_ad}
                  onChange={handleInputChange}
                />
              </div>
            )}

            <button type="submit" className="save-button">
              Save <VscSaveAll />
            </button>

            <div className="message-container">
              {message && (
                <div className={`save-message ${messageType}`}>{message}</div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;
