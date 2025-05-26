// ✅ Product type definition
export interface Product {
  id: number;
  sku: string;
  name: string;
  brand: string;
  category: string;
  size: string;
  color: string;
  purchase_price: number;
  retail_price: number;
  wholesale_price: number;
  current_stock: number;
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

const BASE_URL = 'http://localhost:5000/api/products';

export const productService = {
  getAll: async (): Promise<Product[]> => {
    const res = await fetch(BASE_URL, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load products');
    return res.json();
  },

  add: async (data: any): Promise<Product> => {
    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to add product');
    return res.json();
  },

  update: async (id: number, data: any): Promise<Product> => {
    const res = await fetch(`${BASE_URL}/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update product');
    return res.json();
  },

  delete: async (id: number): Promise<{ message: string }> => {
    const res = await fetch(`${BASE_URL}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete product');
    return res.json();
  },
};
