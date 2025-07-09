import { useEffect } from 'react';
import './Power.css'
import { AiOutlinePoweroff } from 'react-icons/ai'

const Logo = () => {

    useEffect(() => {
      const handleKeydown = (e) => {
        if (e.ctrlKey && e.key.toLowerCase() === 'q') {
          e.preventDefault();
          window.electronAPI.quitApp();
        }
      };

      window.addEventListener('keydown', handleKeydown);
      return () => window.removeEventListener('keydown', handleKeydown);
    }, []);

  return (
    <div className='powerbtn-container' onClick={() => window.electronAPI.quitApp()}>
      <AiOutlinePoweroff />
    </div>
  )
}

export default Logo
