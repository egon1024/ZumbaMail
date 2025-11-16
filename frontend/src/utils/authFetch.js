import { jwtDecode } from 'jwt-decode';

export async function checkTokenExpiration() {
  const token = localStorage.getItem('access_token');
  const refreshToken = localStorage.getItem('refresh_token');

  if (!token) {
    // No access token, session is invalid
    localStorage.clear();
    return false;
  }

  try {
    const decodedToken = jwtDecode(token);
    const currentTime = Date.now() / 1000; // to get in seconds

    if (decodedToken.exp < currentTime) {
      // Access token is expired, try to refresh
      if (!refreshToken) {
        // No refresh token, session is invalid
        localStorage.clear();
        return false;
      }

      try {
        const refreshResp = await fetch('/api/token/refresh/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh: refreshToken }),
        });

        if (refreshResp.ok) {
          const refreshData = await refreshResp.json();
          localStorage.setItem('access_token', refreshData.access);
          // Token successfully refreshed, session is valid
          return true;
        } else {
          // Refresh failed, refresh token is likely expired or invalid
          localStorage.clear();
          return false;
        }
      } catch (refreshError) {
        // Network error during refresh, treat as invalid session
        localStorage.clear();
        return false;
      }
    }
  } catch (decodeError) {
    // Error decoding access token, treat as invalid
    localStorage.clear();
    return false;
  }
  // Access token is valid
  return true;
}

export async function authFetch(url, options = {}) {
  // Ensure token is valid or refreshed before making the request
  if (!(await checkTokenExpiration())) {
    // If checkTokenExpiration returns false, it means session is invalid and
    // localStorage has been cleared. Redirect to login.
    window.location.href = '/';
    throw new Error('Session expired. Please log in again.');
  }

  let token = localStorage.getItem('access_token');
  options.headers = options.headers || {};
  options.headers['Authorization'] = `Bearer ${token}`;
  options.headers['Content-Type'] = 'application/json';

  let response = await fetch(url, options);
  // If authFetch gets a 401, it means the access token might have expired
  // between the checkTokenExpiration call and the actual request, or the
  // refresh token itself was invalid.
  if (response.status === 401) {
    // The checkTokenExpiration should have handled this, but as a fallback
    // if a 401 still occurs, it means the session is truly invalid.
    localStorage.clear();
    window.location.href = '/';
    throw new Error('Session expired. Please log in again.');
  }
  return response;
}
