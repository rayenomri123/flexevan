import './Controls.css'
import { VscRunAll, VscDebugStop, VscBookmark, VscSaveAll } from 'react-icons/vsc'
import { FaSpinner } from 'react-icons/fa'
import { useState } from 'react'

const Controls = ({ isRunning, setIsRunning }) => {
  const [loading, setLoading] = useState(false);

  const handleDhcpAction = async () => {
    // start spinner
    setLoading(true);

    // wait 2 seconds for animation
    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      if (isRunning) {
        await window.electronAPI.stopDhcp();
        console.log('DHCP stopped');
      } else {
        await window.electronAPI.startDhcp();
        console.log('DHCP started');
      }
      // only flip state after the action
      setIsRunning(!isRunning);
    } catch (error) {
      console.error('DHCP error:', error);
      alert(`Error: ${error.message}`);
    } finally {
      // stop spinner
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
        {loading
          ? <FaSpinner className="spin" />
          : (isRunning ? <VscDebugStop /> : <VscRunAll />)
        }
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