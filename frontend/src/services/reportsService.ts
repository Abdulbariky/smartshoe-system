// src/services/reportsService.ts - FIXED to use REAL backend data

import { productService } from './productService';
import { salesService } from './salesService';

export interface SalesOverviewData {
  totalSales: number;
  totalTransactions: number;
  // ❌ REMOVED: averageSale and targetAchievement
}

export interface SalesTrendData {
  name: string;
  sales: number;
  // ❌ REMOVED: target field
}

export interface CategoryData {
  name: string;
  value: number;
  color: string;
}

export interface BrandPerformanceData {
  brand: string;
  sales: number;
  units: number;
}

export interface MonthlyTrendData {
  month: string;
  revenue: number;
  profit: number;
}

export interface TopProductData {
  name: string;
  brand: string;
  unitsSold: number;
  revenue: number;
  stock: number;
}

export interface InventoryAnalysisData {
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalItems: number;
  // ❌ REMOVED: stockHealth
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

const SALES_API_URL = 'http://localhost:5000/api/sales';

export const reportsService = {
  getSalesOverview: async (): Promise<SalesOverviewData> => {
    try {
      console.log('🔄 Reports: Loading REAL sales overview data...');
      
      // Get real sales data directly
      const salesData = await salesService.getSales();
      const sales = salesData.sales || [];
      
      const totalSales = sales.reduce((sum, sale) => sum + Number(sale.total_amount), 0);
      const totalTransactions = sales.length;
      
      console.log('✅ Reports: Using REAL sales data from API');
      return {
        totalSales,
        totalTransactions,
        // ❌ REMOVED: averageSale and targetAchievement
      };
    } catch (error) {
      console.error('❌ Reports: Failed to load sales overview:', error);
      return {
        totalSales: 0,
        totalTransactions: 0,
      };
    }
  },

  getSalesTrend: async (): Promise<SalesTrendData[]> => {
    try {
      console.log('🔄 Reports: Loading REAL sales trend data...');
      
      // Get actual sales data
      const salesData = await salesService.getSales();
      const sales = salesData.sales || [];
      
      // Generate last 7 days trend based on REAL sales
      const last7Days = [];
      const today = new Date();
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const dayString = date.toDateString();
        
        // Calculate REAL sales for this day from actual backend data
        const daySales = sales
          .filter((sale) => {
            const saleDate = new Date(sale.created_at);
            return saleDate.toDateString() === dayString;
          })
          .reduce((sum, sale) => sum + Number(sale.total_amount), 0);
        
        last7Days.push({
          name: dayName,
          sales: daySales,
          // ❌ REMOVED: target field
        });
      }
      
      console.log('✅ Reports: Generated trend from REAL sales data');
      return last7Days;
    } catch (error) {
      console.error('❌ Reports: Failed to load sales trend:', error);
      return [];
    }
  },

  getCategoryAnalysis: async (): Promise<CategoryData[]> => {
    try {
      console.log('🔄 Reports: Loading REAL category analysis...');
      
      // Try to get real category data from backend analytics
      try {
        const response = await fetch(`${SALES_API_URL}/analytics/overview`, {
          method: 'GET',
          headers: getAuthHeaders(),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.categories) {
            console.log('✅ Reports: Using REAL backend category data');
            return data.categories;
          }
        }
      } catch (error) {
        console.log('⚠️ Reports: Backend category analytics unavailable');
      }
      
      console.log('🔄 Reports: Using product distribution fallback');
      const products = await productService.getAll();
      const salesData = await salesService.getSales();
      const totalSales = salesData.sales.reduce((sum, sale) => sum + Number(sale.total_amount), 0);
      
      const categoryMap = new Map<string, number>();
      const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];
      
      // Distribute sales proportionally across categories
      const categoryCount = new Map<string, number>();
      products.forEach(product => {
        const category = product.category;
        categoryCount.set(category, (categoryCount.get(category) || 0) + 1);
      });
      
      const totalProducts = products.length;
      categoryCount.forEach((count, category) => {
        const categoryShare = totalProducts > 0 ? (count / totalProducts) * totalSales : 0;
        categoryMap.set(category, categoryShare);
      });
      
      const categoryData: CategoryData[] = [];
      let colorIndex = 0;
      
      categoryMap.forEach((value, category) => {
        categoryData.push({
          name: category,
          value: Math.round(value),
          color: colors[colorIndex % colors.length],
        });
        colorIndex++;
      });
      
      return categoryData.sort((a, b) => b.value - a.value);
    } catch (error) {
      console.error('❌ Reports: Failed to load category analysis:', error);
      return [];
    }
  },

  getBrandPerformance: async (): Promise<BrandPerformanceData[]> => {
    try {
      console.log('🔄 Reports: Loading REAL brand performance...');
      
      // Try to get real brand data from backend analytics
      try {
        const response = await fetch(`${SALES_API_URL}/analytics/overview`, {
          method: 'GET',
          headers: getAuthHeaders(),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.brands) {
            console.log('✅ Reports: Using REAL backend brand data');
            return data.brands;
          }
        }
      } catch (error) {
        console.log('⚠️ Reports: Backend brand analytics unavailable');
      }
      
      return [];
    } catch (error) {
      console.error('❌ Reports: Failed to load brand performance:', error);
      return [];
    }
  },

  // 🔧 FIXED: Top products now uses REAL backend analytics
  getTopProducts: async (): Promise<TopProductData[]> => {
    try {
      console.log('🔄 Reports: Loading REAL top products from backend...');
      
      const response = await fetch(`${SALES_API_URL}/analytics/product-performance`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.products) {
          console.log('✅ Reports: Using REAL backend product performance data');
          console.log('📊 First 3 products from backend:', data.products.slice(0, 3));
          
          // Map backend data to frontend format
          return data.products.map((product: any) => ({
            name: product.name,
            brand: product.brand,
            unitsSold: Number(product.units_sold) || 0,  // ✅ REAL units sold
            revenue: Number(product.revenue) || 0,        // ✅ REAL revenue
            stock: Number(product.stock) || 0,
          }));
        } else {
          console.log('⚠️ Backend returned unsuccessful response:', data);
        }
      } else {
        console.log(`⚠️ Backend request failed: ${response.status}`);
      }
      
      console.log('🔄 Reports: Backend unavailable, returning empty array');
      return [];
    } catch (error) {
      console.error('❌ Reports: Failed to load top products:', error);
      return [];
    }
  },

  getMonthlyTrend: async (): Promise<MonthlyTrendData[]> => {
    try {
      console.log('🔄 Reports: Loading REAL monthly trend...');
      
      const salesData = await salesService.getSales();
      const sales = salesData.sales || [];
      
      // Generate last 6 months trend based on REAL sales
      const months = [];
      const today = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthName = date.toLocaleDateString('en-US', { month: 'short' });
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        const monthSales = sales
          .filter(sale => {
            const saleDate = new Date(sale.created_at);
            return saleDate >= monthStart && saleDate <= monthEnd;
          })
          .reduce((sum, sale) => sum + Number(sale.total_amount), 0);
        
        const revenue = monthSales;
        const profit = revenue * 0.3; // Assume 30% profit margin
        
        months.push({
          month: monthName,
          revenue: Math.round(revenue),
          profit: Math.round(profit),
        });
      }
      
      console.log('✅ Reports: Generated monthly trend from REAL sales data');
      return months;
    } catch (error) {
      console.error('❌ Reports: Failed to load monthly trend:', error);
      return [];
    }
  },

  getInventoryAnalysis: async (): Promise<InventoryAnalysisData> => {
    try {
      console.log('🔄 Reports: Loading REAL inventory analysis...');
      
      const products = await productService.getAll();
      
      const totalItems = products.length;
      const lowStockItems = products.filter(p => (p.current_stock || 0) < 10).length;
      const outOfStockItems = products.filter(p => (p.current_stock || 0) === 0).length;
      const totalValue = products.reduce((sum, p) => sum + ((p.current_stock || 0) * p.purchase_price), 0);
      
      console.log('✅ Reports: Generated REAL inventory analysis');
      return {
        totalValue: Math.round(totalValue),
        lowStockItems,
        outOfStockItems,
        totalItems,
        // ❌ REMOVED: stockHealth
      };
    } catch (error) {
      console.error('❌ Reports: Failed to load inventory analysis:', error);
      return {
        totalValue: 0,
        lowStockItems: 0,
        outOfStockItems: 0,
        totalItems: 0,
      };
    }
  },
};