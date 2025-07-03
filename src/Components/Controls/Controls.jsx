import './Controls.css'
import { VscRunAll, VscDebugStop, VscBookmark, VscSaveAll } from 'react-icons/vsc'
import { useState } from 'react'

const Controls = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDhcpAction = async () => {
    setLoading(true);
    try {
      if (isRunning) {
        await window.electronAPI.stopDhcp();
        console.log('DHCP stopped');
      } else {
        await window.electronAPI.startDhcp();
        console.log('DHCP started');
      }
      setIsRunning(!isRunning);
    } catch (error) {
      console.error('DHCP error:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='controls-container'>
      <button 
        className={`control-btn ${isRunning ? 'active' : ''}`}
        onClick={handleDhcpAction}
        disabled={loading}
      >
        {isRunning ? <VscDebugStop /> : <VscRunAll />}
      </button>
      <div className="control-btn">
        <VscSaveAll />
      </div>
      <div className="control-btn">
        <VscBookmark />
      </div>
    </div>
  )
}

export default Controls;