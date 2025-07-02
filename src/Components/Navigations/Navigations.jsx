import './Navigations.css'
import { VscTools , VscLayoutStatusbar, VscBell, VscCircuitBoard } from 'react-icons/vsc'

const Navigations = () => {
  return (
    <div className='nav-container'>
      <button className="nav-button">
        <VscTools />
      </button>
      <button className="nav-button">
        <VscLayoutStatusbar />
      </button>
      <button className="nav-button">
        <VscBell />
      </button>
      <button className="nav-button">
        <VscCircuitBoard />
      </button>
    </div>
  )
}

export default Navigations
