// src/services/reportsService.ts
import { productService } from './productService';
import { salesService } from './salesService';
import { inventoryService } from './inventoryService';

export interface SalesOverviewData {
  totalSales: number;
  totalTransactions: number;
  averageSale: number;
  targetAchievement: number;
}

export interface SalesTrendData {
  name: string;
  sales: number;
  target: number;
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
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const reportsService = {
  getSalesOverview: async (): Promise<SalesOverviewData> => {
    try {
      console.log('🔄 Loading sales overview data...');
      
      const salesData = await salesService.getSales();
      const sales = salesData.sales || [];
      
      const totalSales = sales.reduce((sum, sale) => sum + sale.total_amount, 0);
      const totalTransactions = sales.length;
      const averageSale = totalTransactions > 0 ? totalSales / totalTransactions : 0;
      const target = 30000; // Monthly target
      const targetAchievement = target > 0 ? (totalSales / target) * 100 : 0;
      
      return {
        totalSales,
        totalTransactions,
        averageSale,
        targetAchievement: Math.min(targetAchievement, 100),
      };
    } catch (error) {
      console.error('❌ Failed to load sales overview:', error);
      return {
        totalSales: 0,
        totalTransactions: 0,
        averageSale: 0,
        targetAchievement: 0,
      };
    }
  },

  getSalesTrend: async (): Promise<SalesTrendData[]> => {
    try {
      console.log('🔄 Loading sales trend data...');
      
      const salesData = await salesService.getSales();
      const sales = salesData.sales || [];
      
      // Generate last 7 days trend
      const last7Days = [];
      const today = new Date();
      const target = 3500; // Daily target
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const dayString = date.toDateString();
        
        const daySales = sales
          .filter(sale => new Date(sale.created_at).toDateString() === dayString)
          .reduce((sum, sale) => sum + sale.total_amount, 0);
        
        last7Days.push({
          name: dayName,
          sales: daySales,
          target,
        });
      }
      
      return last7Days;
    } catch (error) {
      console.error('❌ Failed to load sales trend:', error);
      return [];
    }
  },

  getCategoryAnalysis: async (): Promise<CategoryData[]> => {
    try {
      console.log('🔄 Loading category analysis...');
      
      const products = await productService.getAll();
      const salesData = await salesService.getSales();
      
      // Group products by category and calculate total sales value
      const categoryMap = new Map<string, { value: number; count: number }>();
      const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];
      
      products.forEach(product => {
        const category = product.category;
        const existing = categoryMap.get(category) || { value: 0, count: 0 };
        
        // Estimate sales value based on stock and retail price
        const estimatedSales = (product.current_stock || 0) * product.retail_price * 0.1; // 10% turnover estimate
        
        categoryMap.set(category, {
          value: existing.value + estimatedSales,
          count: existing.count + 1,
        });
      });
      
      const categoryData: CategoryData[] = [];
      let colorIndex = 0;
      
      categoryMap.forEach((data, category) => {
        categoryData.push({
          name: category,
          value: Math.round(data.value),
          color: colors[colorIndex % colors.length],
        });
        colorIndex++;
      });
      
      return categoryData.sort((a, b) => b.value - a.value);
    } catch (error) {
      console.error('❌ Failed to load category analysis:', error);
      return [];
    }
  },

  getBrandPerformance: async (): Promise<BrandPerformanceData[]> => {
    try {
      console.log('🔄 Loading brand performance...');
      
      const products = await productService.getAll();
      
      // Group by brand and calculate metrics
      const brandMap = new Map<string, { sales: number; units: number }>();
      
      products.forEach(product => {
        const brand = product.brand;
        const existing = brandMap.get(brand) || { sales: 0, units: 0 };
        
        // Estimate based on stock movement and pricing
        const estimatedUnits = Math.max(0, (product.current_stock || 0) * 0.2); // 20% estimated turnover
        const estimatedSales = estimatedUnits * product.retail_price;
        
        brandMap.set(brand, {
          sales: existing.sales + estimatedSales,
          units: existing.units + estimatedUnits,
        });
      });
      
      const brandData: BrandPerformanceData[] = [];
      brandMap.forEach((data, brand) => {
        brandData.push({
          brand,
          sales: Math.round(data.sales),
          units: Math.round(data.units),
        });
      });
      
      return brandData.sort((a, b) => b.sales - a.sales).slice(0, 5);
    } catch (error) {
      console.error('❌ Failed to load brand performance:', error);
      return [];
    }
  },

  getTopProducts: async (): Promise<TopProductData[]> => {
    try {
      console.log('🔄 Loading top products...');
      
      const products = await productService.getAll();
      
      // Calculate performance based on stock turnover and pricing
      const topProducts = products
        .map(product => {
          const estimatedUnits = Math.max(0, (100 - (product.current_stock || 0)) * 0.5); // Estimated from stock depletion
          const revenue = estimatedUnits * product.retail_price;
          
          return {
            name: product.name,
            brand: product.brand,
            unitsSold: Math.round(estimatedUnits),
            revenue: Math.round(revenue),
            stock: product.current_stock || 0,
          };
        })
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);
      
      return topProducts;
    } catch (error) {
      console.error('❌ Failed to load top products:', error);
      return [];
    }
  },

  getMonthlyTrend: async (): Promise<MonthlyTrendData[]> => {
    try {
      console.log('🔄 Loading monthly trend...');
      
      const salesData = await salesService.getSales();
      const sales = salesData.sales || [];
      
      // Generate last 6 months trend
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
          .reduce((sum, sale) => sum + sale.total_amount, 0);
        
        const revenue = monthSales;
        const profit = revenue * 0.25; // Assume 25% profit margin
        
        months.push({
          month: monthName,
          revenue: Math.round(revenue),
          profit: Math.round(profit),
        });
      }
      
      return months;
    } catch (error) {
      console.error('❌ Failed to load monthly trend:', error);
      return [];
    }
  },

  getInventoryAnalysis: async (): Promise<InventoryAnalysisData> => {
    try {
      console.log('🔄 Loading inventory analysis...');
      
      const products = await productService.getAll();
      
      const totalItems = products.length;
      const lowStockItems = products.filter(p => (p.current_stock || 0) < 10).length;
      const outOfStockItems = products.filter(p => (p.current_stock || 0) === 0).length;
      const totalValue = products.reduce((sum, p) => sum + ((p.current_stock || 0) * p.purchase_price), 0);
      
      return {
        totalValue: Math.round(totalValue),
        lowStockItems,
        outOfStockItems,
        totalItems,
      };
    } catch (error) {
      console.error('❌ Failed to load inventory analysis:', error);
      return {
        totalValue: 0,
        lowStockItems: 0,
        outOfStockItems: 0,
        totalItems: 0,
      };
    }
  },
};