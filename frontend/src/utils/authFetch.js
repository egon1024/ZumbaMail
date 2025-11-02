// src/utils/authFetch.js
export async function authFetch(url, options = {}) {
  let token = localStorage.getItem('access_token');
  let refreshToken = localStorage.getItem('refresh_token');
  options.headers = options.headers || {};
  options.headers['Authorization'] = `Bearer ${token}`;
  options.headers['Content-Type'] = 'application/json';

  let response = await fetch(url, options);
  if (response.status === 401 && refreshToken) {
    // Try to refresh the token
    const refreshResp = await fetch('/api/token/refresh/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    });
    if (refreshResp.ok) {
      const refreshData = await refreshResp.json();
      localStorage.setItem('access_token', refreshData.access);
      token = refreshData.access;
      options.headers['Authorization'] = `Bearer ${token}`;
      response = await fetch(url, options);
    } else {
      // Refresh failed, redirect to login
      localStorage.clear();
      window.location.href = '/';
      throw new Error('Session expired. Please log in again.');
    }
  }
  return response;
}
