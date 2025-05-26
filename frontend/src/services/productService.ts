import api from './api';

export interface Product {
  id: number;
  name: string;
  category: string;
  brand: string;  
  size: string;
  color: string;
  purchase_price: number;
  retail_price: number;
  wholesale_price: number;
  supplier: string;
  sku: string;
  current_stock: number;
}

export const productService = {
  getAll: async (): Promise<Product[]> => {
    const response = await api.get('/products');
    return response.data.products;
  },

  create: async (product: Omit<Product, 'id' | 'sku' | 'current_stock'>): Promise<Product> => {
    const response = await api.post('/products', product);
    return response.data.product;
  },

  update: async (id: number, product: Partial<Product>): Promise<Product> => {
    const response = await api.put(`/products/${id}`, product);
    return response.data.product;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/products/${id}`);
  },
};