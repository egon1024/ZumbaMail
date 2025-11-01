import React from 'react';

function Dashboard() {
  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow">
            <div className="card-body text-center">
              <h1 className="mb-4" style={{ color: '#6a359c' }}>Welcome to the Zumba Tool Dashboard!</h1>
              <p className="lead">You are now logged in.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
