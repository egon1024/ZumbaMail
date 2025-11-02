import React from 'react';
import { APP_TITLE } from './appConfig';

function Header() {
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/';
  };

  return (
    <header className="navbar navbar-expand-lg navbar-dark" style={{ background: '#6a359c' }}>
      <div className="container-fluid">
  <span className="navbar-brand mb-0 h1">{APP_TITLE}</span>
        <div className="d-flex align-items-center ms-auto">
          <button className="btn btn-outline-light" onClick={handleLogout}>
            Log Out
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
