import './Profile.css'
import { VscChevronDown } from 'react-icons/vsc'

const Profile = () => {
  return (
    <div className='user-profile-container'>
        <div className="user-icon"></div>
        <div className="user-name">User 1</div>
        <div className="dropdown-btn">
            <VscChevronDown />
        </div>
    </div>
  )
}

export default Profile
