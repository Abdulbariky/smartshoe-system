function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

const API_BASE = 'http://localhost:5000/api';

export const api = {
  get: async (url: string) => {
    const response = await fetch(`${API_BASE}${url}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('API GET failed');
    return response.json();
  },

  post: async (url: string, body: any) => {
    const response = await fetch(`${API_BASE}${url}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error('API POST failed');
    return response.json();
  },

  put: async (url: string, body: any) => {
    const response = await fetch(`${API_BASE}${url}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error('API PUT failed');
    return response.json();
  },

  delete: async (url: string) => {
    const response = await fetch(`${API_BASE}${url}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('API DELETE failed');
    return response.json();
  },
};
