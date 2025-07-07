import React, { useState } from 'react';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic input validation
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }

    try {
      // Fetch all users from the database
      const users = await window.electronAPI.fetchUsers();
      
      if (!users || users.length === 0) {
        setError('No users found in the database');
        return;
      }

      // Find user with matching username and password
      const matchedUser = users.find(
        (user) => user.username === username && user.password === password
      );

      if (matchedUser) {
        // Update loggedin status to '1'
        await window.electronAPI.updateUserLoggedIn({
          id: matchedUser.id,
          loggedin: '1'
        });
        setError('Login successful!');
        // Optionally redirect or perform other actions after successful login
      } else {
        setError('Invalid username or password');
      }
    } catch (err) {
      setError('An error occurred during login');
      console.error('Login error:', err);
    }
  };

  return (
    <div className="auth-login-container">
      <div className="auth-login-title">Login</div>
      <form onSubmit={handleSubmit} className='login-form'>
        <div className="auth-login-form">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div className="auth-login-form">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit" className="auth-login-btn">Login</button>
        {error && (
          <div className={`auth-login-error-message ${error === 'Login successful!' ? 'auth-success' : ''}`}>
            {error}
          </div>
        )}
      </form>
    </div>
  );
};

export default Login;