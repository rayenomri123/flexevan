import './Logo.css'
import logo from '../../assets/logo.png'

const Logo = () => {
  return (
    <div className='logo-container'>
      <img src={logo} alt="AMPERE" className='logo-img' draggable='false'/>
    </div>
  )
}

export default Logo
