const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Universal fetch wrapper for LifeLedger API
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('lifeledger_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
    credentials: 'include'
  };

  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const error = new Error(data?.message || `Request failed with status ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    if (!err.status && err.name === 'TypeError') {
      const networkError = new Error('Cannot connect to LifeLedger server. Please verify the backend is running.');
      networkError.status = 0;
      throw networkError;
    }
    throw err;
  }
}

export const apiClient = {
  auth: {
    register: (userData) =>
      request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      }),
    login: (credentials) =>
      request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      }),
    logout: () =>
      request('/api/auth/logout', {
        method: 'POST'
      }),
    getMe: () =>
      request('/api/auth/me', {
        method: 'GET'
      })
  },
  obligations: {
    list: (params = {}) => {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          query.append(key, val);
        }
      });
      const queryString = query.toString();
      return request(`/api/obligations${queryString ? `?${queryString}` : ''}`);
    },
    create: (obligationData) =>
      request('/api/obligations', {
        method: 'POST',
        body: JSON.stringify(obligationData)
      }),
    get: (id) =>
      request(`/api/obligations/${id}`, {
        method: 'GET'
      }),
    update: (id, updates) =>
      request(`/api/obligations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      }),
    complete: (id) =>
      request(`/api/obligations/${id}/complete`, {
        method: 'PATCH'
      }),
    cancel: (id) =>
      request(`/api/obligations/${id}/cancel`, {
        method: 'PATCH'
      }),
    delete: (id) =>
      request(`/api/obligations/${id}`, {
        method: 'DELETE'
      })
  },
  dashboard: {
    getSummary: () =>
      request('/api/dashboard/summary', {
        method: 'GET'
      })
  }
};
