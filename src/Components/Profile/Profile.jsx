import { useState, useRef, useEffect } from 'react';
import { VscChevronDown, VscSettingsGear } from 'react-icons/vsc';
import { IoIosLogOut } from 'react-icons/io';
import './Profile.css';

const Profile = ({ onLogout }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const profileRef = useRef(null);

  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => {
      console.log('isDropdownOpen:', !prev); // Debug log to verify state toggle
      return !prev;
    });
  };
  
  const handleLogout = async () => {
    try {
      // Fetch all users and find the currently logged-in user
      const users = await window.electronAPI.fetchUsers();
      const loggedInUser = users.find(user => user.loggedin === '1');
      
      if (loggedInUser) {
        // Update loggedin status to '0'
        await window.electronAPI.updateUserLoggedIn({
          id: loggedInUser.id,
          loggedin: '0'
        });
        console.log('Logout successful');
        if (onLogout) {
          onLogout(); // Updates isLoggedIn in WinLayout
        }
      } else {
        console.error('No logged-in user found');
      }
    } catch (err) {
      console.error('Error during logout:', err);
    }
    setIsDropdownOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div
      className={`user-profile-container ${isDropdownOpen ? 'open' : ''}`}
      ref={profileRef}
      onClick={toggleDropdown}
    >
      <div className="user-icon"></div>
      <div className="user-name">Admin</div>
      <div className="dropdown-btn">
        <VscChevronDown className={`chevron-icon ${isDropdownOpen ? 'rotate' : ''}`} />
      </div>
      {isDropdownOpen && (
        <div className="dropdown-menu" onClick={(e) => e.stopPropagation()}>
          <ul>
            <li>
              <VscSettingsGear style={{ marginRight: '2px' }} className="menu-icon" /> Settings
            </li>
            <li onClick={handleLogout}>
              <IoIosLogOut size="18px" className="menu-icon" /> Logout
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default Profile;