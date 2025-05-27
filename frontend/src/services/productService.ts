// src/services/productService.ts
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
  supplier?: string;
  current_stock: number;
  created_at?: string;
  updated_at?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  products?: T[];
  product?: T;
  count?: number;
  message?: string;
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
    const response = await fetch(BASE_URL, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to load products: ${response.statusText}`);
    }
    
    const data: ApiResponse<Product> = await response.json();
    return data.products || [];
  },

  add: async (productData: Omit<Product, 'id' | 'current_stock' | 'created_at' | 'updated_at'>): Promise<Product> => {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(productData),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to add product');
    }
    
    const data: ApiResponse<Product> = await response.json();
    return data.product!;
  },

  update: async (id: number, productData: Partial<Product>): Promise<Product> => {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(productData),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to update product');
    }
    
    const data: ApiResponse<Product> = await response.json();
    return data.product!;
  },

  delete: async (id: number): Promise<{ message: string }> => {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to delete product');
    }
    
    return await response.json();
  },
};