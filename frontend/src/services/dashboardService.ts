import api from './api';

export const dashboardService = {
  getStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },

  getRecentSales: async () => {
    const response = await api.get('/sales?limit=5');
    return response.data;
  },

  getLowStockProducts: async () => {
    const response = await api.get('/products/low-stock');
    return response.data;
  },

  getInventoryValue: async () => {
    const response = await api.get('/dashboard/inventory-value');
    return response.data;
  },
};