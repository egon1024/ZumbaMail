import React from 'react';
import { Navigate } from 'react-router-dom';
import { checkTokenExpiration } from './utils/authFetch';

function PrivateRoute({ children }) {
  const [isValid, setIsValid] = React.useState(null);

  React.useEffect(() => {
    const validateToken = async () => {
      const result = await checkTokenExpiration();
      setIsValid(result);
    };
    validateToken();
  }, []);

  if (isValid === null) {
    return <div>Loading...</div>; // Or a spinner
  }

  if (!isValid) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default PrivateRoute;
