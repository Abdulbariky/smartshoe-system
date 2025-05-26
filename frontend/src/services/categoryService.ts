export interface Category {
  id: number;
  name: string;
  description: string;
}

export interface Brand {
  id: number;
  name: string;
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

const BASE_URL = 'http://localhost:5000/api';

export const getCategories = async () => {
  const res = await fetch(`${BASE_URL}/categories`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!res.ok) throw new Error('Failed to load categories');
  return res.json();
};

export const addCategory = async (data: any) => {
  const res = await fetch(`${BASE_URL}/categories`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error('Failed to add category');
  return res.json();
};

export const deleteCategory = async (id: number) => {
  const res = await fetch(`${BASE_URL}/categories/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!res.ok) throw new Error('Failed to delete category');
  return res.json();
};
