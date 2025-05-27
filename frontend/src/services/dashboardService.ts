// src/services/dashboardService.ts
export interface DashboardStats {
  totalSales: number;
  totalProducts: number;
  lowStockCount: number;
  todaySales: number;
  inventoryValue: number;
}

export interface RecentSale {
  id: number;
  invoice_number: string;
  total_amount: number;
  created_at: string;
  payment_method: string;
  customer?: string;
}

export interface LowStockProduct {
  id: number;
  name: string;
  current_stock: number;
  brand: string;
  category: string;
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

const BASE_URL = 'http://localhost:5000/api';

export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    // Since your backend doesn't have a specific dashboard endpoint,
    // we'll combine data from multiple endpoints
    try {
      const [productsRes, salesRes] = await Promise.all([
        fetch(`${BASE_URL}/products`, { headers: getAuthHeaders() }),
        fetch(`${BASE_URL}/sales`, { headers: getAuthHeaders() })
      ]);

      if (!productsRes.ok || !salesRes.ok) {
        throw new Error('Failed to load dashboard data');
      }

      const productsData = await productsRes.json();
      const salesData = await salesRes.json();

      const products = productsData.products || [];
      const sales = salesData.sales || [];

      // Calculate stats
      const totalProducts = products.length;
      const lowStockCount = products.filter((p: any) => p.current_stock < 10).length;
      const inventoryValue = products.reduce((sum: number, p: any) => sum + (p.current_stock * p.purchase_price), 0);
      
      // Today's sales
      const today = new Date().toDateString();
      const todaySales = sales
        .filter((s: any) => new Date(s.created_at).toDateString() === today)
        .reduce((sum: number, s: any) => sum + s.total_amount, 0);

      const totalSales = sales.reduce((sum: number, s: any) => sum + s.total_amount, 0);

      return {
        totalSales,
        totalProducts,
        lowStockCount,
        todaySales,
        inventoryValue
      };
    } catch (error) {
      console.error('Dashboard stats error:', error);
      // Return default values if API fails
      return {
        totalSales: 0,
        totalProducts: 0,
        lowStockCount: 0,
        todaySales: 0,
        inventoryValue: 0
      };
    }
  },

  getRecentSales: async (): Promise<RecentSale[]> => {
    try {
      const response = await fetch(`${BASE_URL}/sales`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to load recent sales');
      }

      const data = await response.json();
      return (data.sales || []).slice(0, 5); // Return only last 5 sales
    } catch (error) {
      console.error('Recent sales error:', error);
      return [];
    }
  },

  getLowStockProducts: async (): Promise<LowStockProduct[]> => {
    try {
      const response = await fetch(`${BASE_URL}/products`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to load products');
      }

      const data = await response.json();
      const products = data.products || [];
      
      return products
        .filter((p: any) => p.current_stock < 10)
        .map((p: any) => ({
          id: p.id,
          name: p.name,
          current_stock: p.current_stock,
          brand: p.brand,
          category: p.category
        }));
    } catch (error) {
      console.error('Low stock products error:', error);
      return [];
    }
  }
};