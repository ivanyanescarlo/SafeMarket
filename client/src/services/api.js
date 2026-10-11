const API_BASE = '/api';
const GET_CACHE_TTL_MS = 30_000;
const MAX_GET_CACHE_ENTRIES = 100;
const getCache = new Map();
const pendingGetRequests = new Map();
let getCacheVersion = 0;
let cacheAuthToken = localStorage.getItem('safemarket_token');

export const getAuthToken = () => localStorage.getItem('safemarket_token');
export const setAuthToken = (token) => {
  clearGetCache();
  cacheAuthToken = token || null;
  if (token) {
    localStorage.setItem('safemarket_token', token);
  } else {
    localStorage.removeItem('safemarket_token');
  }
};

const canCacheGetRequest = (method, endpoint) => {
  const path = endpoint.split('?')[0];
  if (
    method !== 'GET' ||
    ['/auth', '/messages', '/notifications', '/admin'].some((prefix) => path.startsWith(prefix))
  ) {
    return false;
  }

  if (path.startsWith('/listings/') && path !== '/listings/seller/my-listings') {
    return false;
  }

  return true;
};

function clearGetCache() {
  getCacheVersion += 1;
  getCache.clear();
  pendingGetRequests.clear();
}

export async function request(endpoint, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const token = getAuthToken();
  if (token !== cacheAuthToken) {
    clearGetCache();
    cacheAuthToken = token;
  }

  const isCacheableGet = canCacheGetRequest(method, endpoint);
  if (isCacheableGet) {
    const cached = getCache.get(endpoint);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    const pending = pendingGetRequests.get(endpoint);
    if (pending) {
      return pending;
    }
  }

  const requestCacheVersion = getCacheVersion;
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const config = {
    ...options,
    headers
  };

  const fetchRequest = async () => {
    const res = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await res.json();

    if (!res.ok) {
      // If unauthorized due to expired token
      if (res.status === 401 && endpoint !== '/auth/login' && endpoint !== '/auth/register') {
        localStorage.removeItem('safemarket_token');
        localStorage.removeItem('safemarket_user');
      }
      const err = new Error(data.message || `Request failed with status ${res.status}`);
      Object.assign(err, data);
      throw err;
    }

    if (isCacheableGet && requestCacheVersion === getCacheVersion) {
      getCache.set(endpoint, {
        data,
        expiresAt: Date.now() + GET_CACHE_TTL_MS
      });

      if (getCache.size > MAX_GET_CACHE_ENTRIES) {
        const oldestKey = getCache.keys().next().value;
        getCache.delete(oldestKey);
      }
    } else if (method !== 'GET') {
      clearGetCache();
    }

    return data;
  };

  if (!isCacheableGet) {
    return fetchRequest();
  }

  const pendingRequest = fetchRequest();
  pendingGetRequests.set(endpoint, pendingRequest);
  try {
    return await pendingRequest;
  } finally {
    if (pendingGetRequests.get(endpoint) === pendingRequest) {
      pendingGetRequests.delete(endpoint);
    }
  }
}

export const api = {
  get: (endpoint, options) => request(endpoint, { method: 'GET', ...options }),
  post: (endpoint, body, options) => request(endpoint, { method: 'POST', body: JSON.stringify(body), ...options }),
  put: (endpoint, body, options) => request(endpoint, { method: 'PUT', body: JSON.stringify(body), ...options }),
  delete: (endpoint, options) => request(endpoint, { method: 'DELETE', ...options })
};

export default api;
