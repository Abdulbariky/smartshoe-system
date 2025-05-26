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

interface DashboardStats {
  totalSales: number;
  totalProducts: number;
  lowStockCount: number;
  todaySales: number;
  inventoryValue: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [salesTrend, setSalesTrend] = useState<any[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // Mock data with more realistic values
      const mockStats: DashboardStats = {
        totalSales: 15420,
        totalProducts: 45,
        lowStockCount: 3,
        todaySales: 2850,
        inventoryValue: 125000,
      };

      const mockRecentSales = [
        { id: 1, invoice: 'INV-001', amount: 280, date: '2024-01-22', status: 'completed', customer: 'Walk-in' },
        { id: 2, invoice: 'INV-002', amount: 450, date: '2024-01-22', status: 'completed', customer: 'John Doe' },
        { id: 3, invoice: 'INV-003', amount: 1200, date: '2024-01-21', status: 'pending', customer: 'ABC Store' },
        { id: 4, invoice: 'INV-004', amount: 320, date: '2024-01-21', status: 'completed', customer: 'Walk-in' },
        { id: 5, invoice: 'INV-005', amount: 600, date: '2024-01-20', status: 'completed', customer: 'XYZ Shop' },
      ];

      // Sales trend for last 7 days
      const mockSalesTrend = [
        { day: 'Mon', sales: 1200 },
        { day: 'Tue', sales: 1900 },
        { day: 'Wed', sales: 1500 },
        { day: 'Thu', sales: 2200 },
        { day: 'Fri', sales: 2850 },
        { day: 'Sat', sales: 3200 },
        { day: 'Sun', sales: 2850 },
      ];

      // Low stock products
      const mockLowStock = [
        { id: 1, name: 'Nike Air Max', stock: 5, minStock: 10 },
        { id: 2, name: 'Puma Suede', stock: 3, minStock: 10 },
        { id: 3, name: 'Clarks Desert Boot', stock: 2, minStock: 5 },
      ];

      setStats(mockStats);
      setRecentSales(mockRecentSales);
      setSalesTrend(mockSalesTrend);
      setLowStockProducts(mockLowStock);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
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
          value={`$${stats.todaySales.toLocaleString()}`}
          subtitle="12 transactions"
          icon={<AttachMoney sx={{ fontSize: 40 }} />}
          trend={{ value: 15, isPositive: true }}
          color="success"
        />
        <StatsCard
          title="Total Products"
          value={stats.totalProducts}
          subtitle="In 5 categories"
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
          value={`$${stats.inventoryValue.toLocaleString()}`}
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
                <Tooltip formatter={(value) => `$${value}`} />
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
              {lowStockProducts.map((product) => (
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
                    Stock: {product.stock} (Min: {product.minStock})
                  </Typography>
                </Box>
              ))}
              <Button 
                size="small" 
                fullWidth 
                sx={{ mt: 2 }}
                variant="outlined"
                color="warning"
              >
                View All Low Stock
              </Button>
            </Box>
          </Paper>
        </Box>
      </Box>

      {/* Recent Sales */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Recent Sales
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Invoice</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentSales.map((sale) => (
                <TableRow key={sale.id} hover>
                  <TableCell>{sale.invoice}</TableCell>
                  <TableCell>{sale.date}</TableCell>
                  <TableCell>{sale.customer}</TableCell>
                  <TableCell align="right">${sale.amount}</TableCell>
                  <TableCell>
                    <Chip
                      label={sale.status}
                      color={sale.status === 'completed' ? 'success' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Button size="small">View All Sales</Button>
        </Box>
      </Paper>
    </Box>
  );
}