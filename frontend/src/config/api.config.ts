export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
};

export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  
  // Products
  PRODUCTS: '/products',
  PRODUCT_BY_ID: (id: number) => `/products/${id}`,
  
  // Categories & Brands
  CATEGORIES: '/categories',
  BRANDS: '/brands',
  
  // Inventory
  INVENTORY_STOCK_IN: '/inventory/stock-in',
  INVENTORY_TRANSACTIONS: '/inventory/transactions',
  
  // Sales
  SALES: '/sales',
  SALES_BY_ID: (id: number) => `/sales/${id}`,
  
  // Dashboard
  DASHBOARD_STATS: '/dashboard/stats',
  DASHBOARD_SALES_TREND: '/dashboard/sales-trend',
  DASHBOARD_LOW_STOCK: '/dashboard/low-stock',
};