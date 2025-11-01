import React from 'react';

function Header() {
  const handleLogout = () => {
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
    window.location.href = '/';
  };

  return (
    <header className="navbar navbar-expand-lg navbar-dark" style={{ background: '#6a359c' }}>
      <div className="container-fluid">
        <span className="navbar-brand mb-0 h1">Zumba Tool</span>
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
