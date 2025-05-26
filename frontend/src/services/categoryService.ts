import api from './api';

export interface Category {
  id: number;
  name: string;
  description?: string;
}

export interface Brand {
  id: number;
  name: string;
}

export const categoryService = {
  getCategories: async (): Promise<Category[]> => {
    const response = await api.get('/categories');
    return response.data.categories;
  },

  addCategory: async (category: Omit<Category, 'id'>): Promise<Category> => {
    const response = await api.post('/categories', category);
    return response.data.category;
  },

  updateCategory: async (id: number, category: Partial<Category>): Promise<Category> => {
    const response = await api.put(`/categories/${id}`, category);
    return response.data.category;
  },

  deleteCategory: async (id: number): Promise<void> => {
    await api.delete(`/categories/${id}`);
  },

  getBrands: async (): Promise<Brand[]> => {
    const response = await api.get('/brands');
    return response.data.brands;
  },

  addBrand: async (brand: Omit<Brand, 'id'>): Promise<Brand> => {
    const response = await api.post('/brands', brand);
    return response.data.brand;
  },

  updateBrand: async (id: number, brand: Partial<Brand>): Promise<Brand> => {
    const response = await api.put(`/brands/${id}`, brand);
    return response.data.brand;
  },

  deleteBrand: async (id: number): Promise<void> => {
    await api.delete(`/brands/${id}`);
  },
};