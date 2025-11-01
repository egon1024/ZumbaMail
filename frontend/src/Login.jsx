import React, { useState } from 'react';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onLogin) onLogin(username, password);
  };

  // Bootstrap purple: #6f42c1 (border), #f3e8ff (background)
  return (
    <div
      className="d-flex align-items-center justify-content-center min-vh-100"
      style={{ background: '#4B2067' }}
    >
      <div
        className="d-flex flex-column justify-content-center align-items-center w-100"
        style={{ minHeight: '100vh' }}
      >
        <div
          className="p-4 rounded shadow mx-auto"
          style={{
            background: 'white',
            border: '3px solid #6f42c1',
            borderRadius: '1rem',
            width: '100%',
            maxWidth: '600px',
            boxSizing: 'border-box',
            padding: '2rem',
          }}
        >
          <h2 className="text-center mb-4" style={{ color: '#6f42c1' }}>Zumba Mail Tool</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Username</label>
              <input
                type="text"
                className="form-control"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
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
              />
            </div>
            <button type="submit" className="btn btn-primary w-100">Log In</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;;