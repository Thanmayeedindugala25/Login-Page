import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Navbar = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/home" className="navbar-brand">
        <span className="brand-icon">🐾</span> 
        <span>PurrAuth</span>
      </Link>

      <div className="navbar-links">
        {token && user ? (
          <>
            <div className="user-badge">
              <div className="avatar-circle">
                {user.name ? user.name.charAt(0).toUpperCase() : '🐱'}
              </div>
              <span>{user.name}</span>
            </div>
            <button onClick={handleLogout} className="btn-secondary">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link 
              to="/login" 
              className={`nav-link ${location.pathname === '/login' ? 'active' : ''}`}
            >
              Login
            </Link>
            <Link 
              to="/register" 
              className={`nav-link ${location.pathname === '/register' ? 'active' : ''}`}
            >
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};
