import React, { useState } from 'react';
import { APP_TITLE } from './appConfig';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

    const [success, setSuccess] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/token/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        setLoading(false);
        setError('Invalid username or password');
        return;
      }

      const data = await response.json();
      sessionStorage.setItem('access_token', data.access);
      sessionStorage.setItem('refresh_token', data.refresh);

      setLoading(false);
      setSuccess(true);
      if (onLogin) onLogin(username, password);
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
    } catch (err) {
      setError(err.message || 'Login failed');
      setLoading(false);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100" style={{ background: '#6a359c' }}>
      <div className="p-4 rounded shadow mx-auto" style={{
        background: 'white',
        border: '3px solid #3a185b',
        borderRadius: '1rem',
        width: '100%',
        maxWidth: '600px',
        boxSizing: 'border-box',
        padding: '2rem',
      }}>
  <h2 className="text-center mb-4" style={{ color: '#6f42c1' }}>{APP_TITLE} Login</h2>
        <form onSubmit={handleSubmit}>
          {success && (
            <div className="alert alert-success text-center" role="alert">
              Login successful! Redirecting to dashboard...
            </div>
          )}
          <div className="mb-3">
            <label className="form-label">Username</label>
            <input
              type="text"
              className="form-control"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          {error && <div className="alert alert-danger">{error}</div>}
          <button type="submit" className="btn btn-primary w-100" disabled={loading}>
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;