import React from 'react';
import { Navigate } from 'react-router-dom';

function PrivateRoute({ children }) {
  const token = sessionStorage.getItem('access_token');
  if (!token) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default PrivateRoute;
