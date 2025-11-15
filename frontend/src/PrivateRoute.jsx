import React from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('access_token');
  if (!token) {
    return <Navigate to="/" replace />;
  }

  try {
    const decodedToken = jwtDecode(token);
    const currentTime = Date.now() / 1000; // to get in seconds

    if (decodedToken.exp < currentTime) {
      // Token is expired
      localStorage.clear(); // Clear all session data
      return <Navigate to="/" replace />;
    }
  } catch (error) {
    // Error decoding token, treat as invalid
    localStorage.clear();
    return <Navigate to="/" replace />;
  }

  return children;
}

export default PrivateRoute;
