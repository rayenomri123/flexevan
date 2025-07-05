import './Power.css'
import { AiOutlinePoweroff } from 'react-icons/ai'

const Logo = () => {
  return (
    <div className='powerbtn-container' onClick={() => window.electronAPI.quitApp()}>
      <AiOutlinePoweroff />
    </div>
  )
}

export default Logo
