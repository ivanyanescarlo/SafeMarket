const API_BASE = '/api';

export const getAuthToken = () => localStorage.getItem('safemarket_token');
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('safemarket_token', token);
  } else {
    localStorage.removeItem('safemarket_token');
  }
};

export async function request(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const config = {
    ...options,
    headers
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await res.json();

    if (!res.ok) {
      // If unauthorized due to expired token
      if (res.status === 401 && endpoint !== '/auth/login' && endpoint !== '/auth/register') {
        localStorage.removeItem('safemarket_token');
        localStorage.removeItem('safemarket_user');
      }
      throw new Error(data.message || `Request failed with status ${res.status}`);
    }

    return data;
  } catch (error) {
    throw error;
  }
}

export const api = {
  get: (endpoint, options) => request(endpoint, { method: 'GET', ...options }),
  post: (endpoint, body, options) => request(endpoint, { method: 'POST', body: JSON.stringify(body), ...options }),
  put: (endpoint, body, options) => request(endpoint, { method: 'PUT', body: JSON.stringify(body), ...options }),
  delete: (endpoint, options) => request(endpoint, { method: 'DELETE', ...options })
};

export default api;
