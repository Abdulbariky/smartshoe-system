import { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
} from '@mui/material';
import {
  AttachMoney,
  Inventory,
  ShoppingCart,
  Warning,
  Refresh,
  TrendingUp,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import StatsCard from '../../components/dashboard/StatsCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import { dashboardService, type DashboardStats, type RecentSale, type LowStockProduct } from '../../services/dashboardService';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [salesTrend, setSalesTrend] = useState<any[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('🔄 Loading dashboard data from API...');

      // ✅ Real API calls instead of mock data
      const [statsData, recentSalesData, lowStockData] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getRecentSales(),
        dashboardService.getLowStockProducts()
      ]);

      console.log('✅ Dashboard stats loaded:', statsData);
      console.log('✅ Recent sales loaded:', recentSalesData);
      console.log('✅ Low stock products loaded:', lowStockData);

      setStats(statsData);
      setRecentSales(recentSalesData);
      setLowStockProducts(lowStockData);

      // Generate sales trend based on recent sales data
      const salesTrendData = generateSalesTrend(recentSalesData);
      setSalesTrend(salesTrendData);

    } catch (err: any) {
      console.error('❌ Failed to load dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
      
      // Fallback to basic stats if API fails
      setStats({
        totalSales: 0,
        totalProducts: 0,
        lowStockCount: 0,
        todaySales: 0,
        inventoryValue: 0
      });
      setRecentSales([]);
      setLowStockProducts([]);
      setSalesTrend([]);
    } finally {
      setLoading(false);
    }
  };

  // Generate sales trend from recent sales data
  const generateSalesTrend = (sales: RecentSale[]) => {
    const last7Days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      const dayString = date.toDateString();
      
      // Calculate sales for this day
      const daySales = sales
        .filter(sale => new Date(sale.created_at).toDateString() === dayString)
        .reduce((sum, sale) => sum + sale.total_amount, 0);
      
      last7Days.push({
        day: dayName,
        sales: daySales
      });
    }
    
    return last7Days;
  };

  useEffect(() => {
    fetchDashboardData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <LoadingSpinner message="Loading dashboard..." />;
  if (error) return <ErrorAlert error={error} onRetry={fetchDashboardData} />;
  if (!stats) return null;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Dashboard
        </Typography>
        <Button
          startIcon={<Refresh />}
          onClick={fetchDashboardData}
          variant="outlined"
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {/* Stats Cards */}
      <Box
        display="grid"
        gridTemplateColumns="repeat(auto-fit, minmax(250px, 1fr))"
        gap={3}
        mb={3}
      >
        <StatsCard
          title="Today's Sales"
          value={`KES ${stats.todaySales.toLocaleString()}`}
          subtitle={`${recentSales.filter(sale => 
            new Date(sale.created_at).toDateString() === new Date().toDateString()
          ).length} transactions`}
          icon={<AttachMoney sx={{ fontSize: 40 }} />}
          color="success"
        />
        <StatsCard
          title="Total Products"
          value={stats.totalProducts}
          subtitle="In inventory"
          icon={<Inventory sx={{ fontSize: 40 }} />}
          color="primary"
        />
        <StatsCard
          title="Low Stock Alert"
          value={stats.lowStockCount}
          subtitle="Need reordering"
          icon={<Warning sx={{ fontSize: 40 }} />}
          color="warning"
        />
        <StatsCard
          title="Inventory Value"
          value={`KES ${stats.inventoryValue.toLocaleString()}`}
          subtitle="Total stock value"
          icon={<ShoppingCart sx={{ fontSize: 40 }} />}
          color="info"
        />
      </Box>

      <Box display="flex" gap={3} flexWrap="wrap" mb={3}>
        {/* Sales Trend Chart */}
        <Box flex="2 1 600px">
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="h6">
                Sales Trend (Last 7 Days)
              </Typography>
              <TrendingUp color="success" />
            </Box>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={salesTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip formatter={(value) => `KES ${value}`} />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ fill: '#2563eb' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Box>

        {/* Low Stock Alert */}
        <Box flex="1 1 300px">
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom color="warning.main">
              ⚠️ Low Stock Products
            </Typography>
            <Box sx={{ mt: 2 }}>
              {lowStockProducts.length > 0 ? (
                <>
                  {lowStockProducts.slice(0, 3).map((product) => (
                    <Box
                      key={product.id}
                      sx={{
                        p: 1.5,
                        mb: 1,
                        bgcolor: 'warning.light',
                        borderRadius: 1,
                        opacity: 0.9,
                      }}
                    >
                      <Typography variant="body2" fontWeight="medium">
                        {product.name}
                      </Typography>
                      <Typography variant="caption" color="error">
                        Stock: {product.current_stock} | {product.brand}
                      </Typography>
                    </Box>
                  ))}
                  <Button
                    size="small"
                    fullWidth
                    sx={{ mt: 2 }}
                    variant="outlined"
                    color="warning"
                    onClick={() => window.location.href = '/inventory'}
                  >
                    View All Low Stock
                  </Button>
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  All products are well stocked! 🎉
                </Typography>
              )}
            </Box>
          </Paper>
        </Box>
      </Box>

      {/* Recent Sales */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Recent Sales
        </Typography>
        {recentSales.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Invoice</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Payment</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentSales.map((sale) => (
                  <TableRow key={sale.id} hover>
                    <TableCell>{sale.invoice_number}</TableCell>
                    <TableCell>
                      {new Date(sale.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{sale.customer || 'Walk-in'}</TableCell>
                    <TableCell align="right">KES {sale.total_amount}</TableCell>
                    <TableCell>
                      <Chip
                        label={sale.payment_method}
                        color="success"
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography color="text.secondary" align="center" sx={{ py: 3 }}>
            No recent sales found
          </Typography>
        )}
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Button 
            size="small"
            onClick={() => window.location.href = '/sales'}
          >
            View All Sales
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}