// src/services/reportsService.ts - COMPLETE with REAL profit calculations

import { productService } from './productService';
import { salesService } from './salesService';

export interface SalesOverviewData {
  totalSales: number;
  totalTransactions: number;
}

export interface SalesTrendData {
  name: string;
  sales: number;
}

export interface CategoryData {
  name: string;
  value: number;
  profit: number;
  color: string;
}

export interface BrandPerformanceData {
  brand: string;
  sales: number;
  units: number;
  profit: number;
}

export interface MonthlyTrendData {
  month: string;
  revenue: number;
  profit: number;
  profit_margin: number;
}

export interface TopProductData {
  name: string;
  brand: string;
  unitsSold: number;
  revenue: number;
  actual_profit: number;
  profit_margin: number;
  stock: number;
}

export interface InventoryAnalysisData {
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalItems: number;
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
      
      const salesData = await salesService.getSales();
      const sales = salesData.sales || [];
      
      const totalSales = sales.reduce((sum, sale) => sum + Number(sale.total_amount), 0);
      const totalTransactions = sales.length;
      
      console.log('✅ Reports: Using REAL sales data from API');
      return {
        totalSales,
        totalTransactions,
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
      console.log('🔄 Reports: Loading REAL sales trend...');
      
      const response = await fetch(`${SALES_API_URL}/analytics/sales-trend`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.trend) {
          console.log('✅ Reports: Using backend sales trend data');
          return data.trend.map((item: any) => ({
            name: item.name,
            sales: item.sales,
          }));
        }
      }
      
      // Fallback to previous method if backend endpoint unavailable
      console.log('🔄 Reports: Using fallback sales trend calculation');
      const salesData = await salesService.getSales();
      const sales = salesData.sales || [];
      
      const last7Days = [];
      const today = new Date();
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const dayString = date.toDateString();
        
        const daySales = sales
          .filter((sale) => {
            const saleDate = new Date(sale.created_at);
            return saleDate.toDateString() === dayString;
          })
          .reduce((sum, sale) => sum + Number(sale.total_amount), 0);
        
        last7Days.push({
          name: dayName,
          sales: daySales,
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
      
      const response = await fetch(`${SALES_API_URL}/analytics/category-performance`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.categories) {
          console.log('✅ Reports: Using REAL backend category data with profit');
          return data.categories;
        }
      }
      
      // Fallback method
      console.log('🔄 Reports: Using product distribution fallback');
      const products = await productService.getAll();
      const salesData = await salesService.getSales();
      const totalSales = salesData.sales.reduce((sum, sale) => sum + Number(sale.total_amount), 0);
      
      const categoryMap = new Map<string, number>();
      const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];
      
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
          profit: Math.round(value * 0.2), // Rough estimate for fallback
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
      
      const response = await fetch(`${SALES_API_URL}/analytics/brand-performance`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.brands) {
          console.log('✅ Reports: Using REAL backend brand data with profit');
          return data.brands;
        }
      }
      
      return [];
    } catch (error) {
      console.error('❌ Reports: Failed to load brand performance:', error);
      return [];
    }
  },

  getTopProducts: async (): Promise<TopProductData[]> => {
    try {
      console.log('🔄 Reports: Loading REAL top products with profit...');
      
      const response = await fetch(`${SALES_API_URL}/analytics/product-performance`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.products) {
          console.log('✅ Reports: Using REAL backend product performance data with profit');
          console.log('📊 Products received:', data.products);
          
          return data.products.map((product: any) => ({
            name: product.name,
            brand: product.brand,
            unitsSold: Number(product.units_sold) || 0,
            revenue: Number(product.revenue) || 0,
            actual_profit: Number(product.actual_profit) || 0,
            profit_margin: Number(product.profit_margin) || 0,
            stock: Number(product.stock) || 0,
          }));
        } else {
          console.log('⚠️ Backend returned no products or unsuccessful response');
        }
      } else {
        console.log(`⚠️ Backend request failed with status: ${response.status}`);
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
      console.log('🔄 Reports: Loading REAL monthly trend with profit...');
      
      const response = await fetch(`${SALES_API_URL}/analytics/monthly-trend`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.monthly_trend) {
          console.log('✅ Reports: Using REAL backend monthly trend with profit calculations');
          return data.monthly_trend;
        }
      }
      
      // Fallback
      console.log('🔄 Reports: Using fallback monthly trend calculation');
      const salesData = await salesService.getSales();
      const sales = salesData.sales || [];
      
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
        const profit = revenue * 0.2; // Conservative estimate
        
        months.push({
          month: monthName,
          revenue: Math.round(revenue),
          profit: Math.round(profit),
          profit_margin: revenue > 0 ? (profit / revenue * 100) : 0,
        });
      }
      
      console.log('⚠️ Reports: Using fallback monthly trend');
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

  getProfitSummary: async () => {
    try {
      console.log('🔄 Reports: Loading profit summary...');
      
      const response = await fetch(`${SALES_API_URL}/analytics/profit-summary`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.profit_summary) {
          console.log('✅ Reports: Got real profit summary');
          return data.profit_summary;
        }
      }
      
      return null;
    } catch (error) {
      console.error('❌ Reports: Failed to load profit summary:', error);
      return null;
    }
  },
};