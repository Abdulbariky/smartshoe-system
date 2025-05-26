const token = localStorage.getItem('token') || sessionStorage.getItem('token');
const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

export const authService = {
  login: async (username: string, password: string) => {
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    return await response.json();
  },
};
