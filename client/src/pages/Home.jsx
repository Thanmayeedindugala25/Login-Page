import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export const Home = () => {
  const { user, token, logout } = useAuth();
  const [usersList, setUsersList] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      if (!token) return;

      try {
        const response = await fetch('http://localhost:5000/api/users', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (response.ok) {
          setUsersList(data.users || []);
        } else {
          setErrorMsg(data.message || 'Failed to fetch registered users.');
        }
      } catch (err) {
        console.error('Fetch users error:', err);
        setErrorMsg('Error connecting to backend API.');
      } finally {
        setIsLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [token]);

  return (
    <div className="dashboard-container">
      {/* Logged-in User Profile Welcome Card */}
      <div className="welcome-card">
        <div className="welcome-info">
          <h1>Welcome back, {user?.name || 'Friend'}! 🐾</h1>
          <p>Welcome to your cozy space. We're happy to have you here! 🐾</p>
          
          <div className="user-details-grid">
            <div className="detail-pill">
              <span>Account ID:</span> <strong>#{user?.id}</strong>
            </div>
            <div className="detail-pill">
              <span>Email:</span> <strong>{user?.email}</strong>
            </div>
          </div>
        </div>

        <button onClick={logout} className="btn-secondary">
          Logout Session
        </button>
      </div>

      {/* Table / List of Registered Users */}
      <div className="table-card">
        <div className="table-header">
          <div>
            <h2 className="table-title">Registered Members</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
              Cozy community members stored in Supabase PostgreSQL
            </p>
          </div>
          <div className="user-count-badge">
            {usersList.length} Member{usersList.length === 1 ? '' : 's'}
          </div>
        </div>

        {errorMsg && (
          <div className="alert-box alert-error">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {isLoadingUsers ? (
          <div className="loading-spinner-container" style={{ minHeight: '180px' }}>
            <div className="spinner"></div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Gathering community members...</p>
          </div>
        ) : (
          <div className="custom-table-wrapper">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                </tr>
              </thead>
              <tbody>
                {usersList.length > 0 ? (
                  usersList.map((u) => {
                    const isCurrentUser = u.id === user?.id || u.email === user?.email;
                    return (
                      <tr key={u.id} className={isCurrentUser ? 'current-user-row' : ''}>
                        <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>#{u.id}</td>
                        <td style={{ fontWeight: 600 }}>
                          {u.name}
                          {isCurrentUser && <span className="you-badge">YOU</span>}
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                      No registered members found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
