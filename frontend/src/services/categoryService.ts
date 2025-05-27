// src/services/categoryService.ts
export interface Category {
  id: number;
  name: string;
  description: string;
}

export interface Brand {
  id: number;
  name: string;
  country?: string;
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

const BASE_URL = 'http://localhost:5000/api';

// Category Services
export const categoryService = {
  getAll: async (): Promise<Category[]> => {
    const response = await fetch(`${BASE_URL}/categories`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to load categories');
    }

    return await response.json();
  },

  add: async (data: { name: string; description: string }): Promise<{ message: string }> => {
    const response = await fetch(`${BASE_URL}/categories`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to add category');
    }

    return await response.json();
  },

  update: async (id: number, data: { name: string; description: string }): Promise<{ message: string }> => {
    const response = await fetch(`${BASE_URL}/categories/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to update category');
    }

    return await response.json();
  },

  delete: async (id: number): Promise<{ message: string }> => {
    const response = await fetch(`${BASE_URL}/categories/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to delete category');
    }

    return await response.json();
  },
};

// Brand Services
export const brandService = {
  getAll: async (): Promise<Brand[]> => {
    const response = await fetch(`${BASE_URL}/brands`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to load brands');
    }

    return await response.json();
  },

  add: async (data: { name: string; country?: string }): Promise<{ message: string }> => {
    const response = await fetch(`${BASE_URL}/brands`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to add brand');
    }

    return await response.json();
  },

  update: async (id: number, data: { name: string; country?: string }): Promise<{ message: string }> => {
    const response = await fetch(`${BASE_URL}/brands/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to update brand');
    }

    return await response.json();
  },

  delete: async (id: number): Promise<{ message: string }> => {
    const response = await fetch(`${BASE_URL}/brands/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to delete brand');
    }

    return await response.json();
  },
};