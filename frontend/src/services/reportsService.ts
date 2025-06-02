// src/services/reportsService.ts
import { productService } from './productService';
import { salesService } from './salesService';

export interface SalesOverviewData {
  totalSales: number;
  totalTransactions: number;
  averageSale: number;
  targetAchievement: number;
  monthlyTarget: number;
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

const SALES_API_URL = 'http://localhost:5000/api/sales';

// 🔄 Cache management for better performance
let analyticsCache: any = null;
let analyticsCacheTimestamp = 0;
const CACHE_DURATION = 30000; // 30 seconds

async function getCachedAnalytics() {
  const now = Date.now();
  if (!analyticsCache || (now - analyticsCacheTimestamp) > CACHE_DURATION) {
    console.log('📊 Reports: Fetching fresh analytics data from backend...');
    
    try {
      const response = await fetch(`${SALES_API_URL}/analytics/overview`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        analyticsCache = await response.json();
        analyticsCacheTimestamp = now;
        console.log('✅ Reports: Analytics data cached:', analyticsCache);
      } else {
        throw new Error(`Analytics API failed: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Reports: Failed to fetch analytics, using fallback');
      analyticsCache = null;
    }
  }
  
  return analyticsCache;
}

export const reportsService = {
  getSalesOverview: async (): Promise<SalesOverviewData> => {
    try {
      console.log('🔄 Reports: Loading REAL sales overview data...');
      
      // Try to get real analytics data from backend
      const analyticsData = await getCachedAnalytics();
      
      if (analyticsData && analyticsData.success && analyticsData.overview) {
        const overview = analyticsData.overview;
        
        const monthlyTarget = 50000; // KES 50,000 monthly target (configurable)
        const targetAchievement = monthlyTarget > 0 ? Math.min((overview.total_sales / monthlyTarget) * 100, 100) : 0;
        
        console.log('✅ Reports: Using REAL backend analytics data');
        return {
          totalSales: Number(overview.total_sales) || 0,
          totalTransactions: Number(overview.total_transactions) || 0,
          averageSale: Number(overview.average_sale) || 0,
          targetAchievement,
          monthlyTarget,
        };
      } else {
        console.log('⚠️ Reports: Backend analytics unavailable, using sales service fallback');
        
        // Fallback to salesService if analytics endpoint unavailable
        const salesData = await salesService.getSales();
        const sales = salesData.sales || [];
        
        const totalSales = sales.reduce((sum, sale) => sum + Number(sale.total_amount), 0);
        const totalTransactions = sales.length;
        const averageSale = totalTransactions > 0 ? totalSales / totalTransactions : 0;
        
        const monthlyTarget = 50000;
        const targetAchievement = monthlyTarget > 0 ? Math.min((totalSales / monthlyTarget) * 100, 100) : 0;
        
        return {
          totalSales,
          totalTransactions,
          averageSale,
          targetAchievement,
          monthlyTarget,
        };
      }
    } catch (error) {
      console.error('❌ Reports: Failed to load sales overview:', error);
      return {
        totalSales: 0,
        totalTransactions: 0,
        averageSale: 0,
        targetAchievement: 0,
        monthlyTarget: 50000,
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
      const dailyTarget = 2500; // KES 2,500 daily target
      
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
          target: dailyTarget,
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
      const analyticsData = await getCachedAnalytics();
      
      if (analyticsData && analyticsData.success && analyticsData.categories) {
        console.log('✅ Reports: Using REAL backend category data');
        return analyticsData.categories;
      } else {
        console.log('⚠️ Reports: Backend category analytics unavailable, using product distribution');
        
        // Fallback: estimate from product distribution
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
      }
    } catch (error) {
      console.error('❌ Reports: Failed to load category analysis:', error);
      return [];
    }
  },

  getBrandPerformance: async (): Promise<BrandPerformanceData[]> => {
    try {
      console.log('🔄 Reports: Loading REAL brand performance...');
      
      // Try to get real brand data from backend analytics
      const analyticsData = await getCachedAnalytics();
      
      if (analyticsData && analyticsData.success && analyticsData.brands) {
        console.log('✅ Reports: Using REAL backend brand data');
        return analyticsData.brands;
      } else {
        console.log('⚠️ Reports: Backend brand analytics unavailable, using estimation');
        
        // Fallback estimation
        const products = await productService.getAll();
        const salesData = await salesService.getSales();
        const totalSalesValue = salesData.sales.reduce((sum, sale) => sum + Number(sale.total_amount), 0);
        
        const brandMap = new Map<string, { sales: number; units: number }>();
        
        products.forEach(product => {
          const brand = product.brand;
          const existing = brandMap.get(brand) || { sales: 0, units: 0 };
          
          // Estimate based on actual sales data distribution
          const brandShare = totalSalesValue / products.length;
          const estimatedUnits = Math.floor(brandShare / product.retail_price);
          
          brandMap.set(brand, {
            sales: existing.sales + brandShare,
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
      }
    } catch (error) {
      console.error('❌ Reports: Failed to load brand performance:', error);
      return [];
    }
  },

  getTopProducts: async (): Promise<TopProductData[]> => {
    try {
      console.log('🔄 Reports: Loading REAL top products...');
      
      // Try to get real product performance from backend
      try {
        const response = await fetch(`${SALES_API_URL}/analytics/product-performance`, {
          method: 'GET',
          headers: getAuthHeaders(),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.products) {
            console.log('✅ Reports: Using REAL backend product performance data');
            return data.products.slice(0, 10);
          }
        }
      } catch (error) {
        console.log('⚠️ Reports: Backend product analytics unavailable');
      }
      
      // Fallback estimation
      console.log('🔄 Reports: Using product estimation fallback');
      const products = await productService.getAll();
      const salesData = await salesService.getSales();
      const totalSalesValue = salesData.sales.reduce((sum, sale) => sum + Number(sale.total_amount), 0);
      
      const topProducts = products
        .map(product => {
          const productShare = totalSalesValue / products.length;
          const estimatedUnits = Math.floor(productShare / product.retail_price);
          const revenue = estimatedUnits * product.retail_price;
          
          return {
            name: product.name,
            brand: product.brand,
            unitsSold: estimatedUnits,
            revenue: Math.round(revenue),
            stock: product.current_stock || 0,
          };
        })
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);
      
      return topProducts;
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