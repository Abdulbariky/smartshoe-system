import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Alert,
} from '@mui/material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  Assessment,
  Inventory,
  AttachMoney,
  Refresh,
} from '@mui/icons-material';
import { reportsService } from '../../services/reportsService';
import type {
  SalesOverviewData,
  SalesTrendData,
  CategoryData,
  BrandPerformanceData,
  MonthlyTrendData,
  TopProductData,
  InventoryAnalysisData,
} from '../../services/reportsService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`reports-tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ReportsPage() {
  const [tabValue, setTabValue] = useState(0);
  const [period, setPeriod] = useState('week');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Real data states
  const [salesOverview, setSalesOverview] = useState<SalesOverviewData | null>(null);
  const [salesTrend, setSalesTrend] = useState<SalesTrendData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [brandPerformance, setBrandPerformance] = useState<BrandPerformanceData[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyTrendData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProductData[]>([]);
  const [inventoryAnalysis, setInventoryAnalysis] = useState<InventoryAnalysisData | null>(null);

  useEffect(() => {
    fetchReportsData();
  }, [period]);

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('🔄 Loading reports data from API...');

      // Load all report data in parallel
      const [
        salesOverviewData,
        salesTrendData,
        categoryAnalysisData,
        brandPerformanceData,
        monthlyTrendData,
        topProductsData,
        inventoryAnalysisData,
      ] = await Promise.all([
        reportsService.getSalesOverview(),
        reportsService.getSalesTrend(),
        reportsService.getCategoryAnalysis(),
        reportsService.getBrandPerformance(),
        reportsService.getMonthlyTrend(),
        reportsService.getTopProducts(),
        reportsService.getInventoryAnalysis(),
      ]);

      console.log('✅ Reports data loaded successfully');

      setSalesOverview(salesOverviewData);
      setSalesTrend(salesTrendData);
      setCategoryData(categoryAnalysisData);
      setBrandPerformance(brandPerformanceData);
      setMonthlyTrend(monthlyTrendData);
      setTopProducts(topProductsData);
      setInventoryAnalysis(inventoryAnalysisData);
    } catch (err: any) {
      console.error('❌ Failed to load reports data:', err);
      setError(err.message || 'Failed to load reports data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (loading) return <LoadingSpinner message="Loading reports..." />;
  if (error) return <ErrorAlert error={error} onRetry={fetchReportsData} />;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Reports & Analytics
        </Typography>
        <Box display="flex" gap={2}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Period</InputLabel>
            <Select
              value={period}
              label="Period"
              onChange={(e) => setPeriod(e.target.value)}
              disabled={loading}
            >
              <MenuItem value="day">Today</MenuItem>
              <MenuItem value="week">This Week</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
              <MenuItem value="year">This Year</MenuItem>
            </Select>
          </FormControl>
          <Button
            startIcon={<Refresh />}
            onClick={fetchReportsData}
            variant="outlined"
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab icon={<TrendingUp />} label="Sales Overview" />
          <Tab icon={<Assessment />} label="Product Performance" />
          <Tab icon={<Inventory />} label="Inventory Analysis" />
          <Tab icon={<AttachMoney />} label="Financial Summary" />
        </Tabs>
      </Paper>

      {/* Sales Overview Tab */}
      <TabPanel value={tabValue} index={0}>
        {salesOverview && (
          <>
            {/* Summary Cards */}
            <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={3} mb={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Total Sales
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    KES {salesOverview.totalSales.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    {salesOverview.totalTransactions} transactions
                  </Typography>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Transactions
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {salesOverview.totalTransactions}
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    Total completed sales
                  </Typography>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Average Sale
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    KES {Math.round(salesOverview.averageSale).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="info.main">
                    Per transaction
                  </Typography>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Target Achievement
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {Math.round(salesOverview.targetAchievement)}%
                  </Typography>
                  <Typography variant="body2" color={salesOverview.targetAchievement >= 80 ? "success.main" : "warning.main"}>
                    {salesOverview.targetAchievement >= 80 ? "On track" : "Below target"}
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            {/* Sales Trend Chart */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Daily Sales Trend
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => `KES ${value}`} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="sales" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    name="Actual Sales"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="target" 
                    stroke="#82ca9d" 
                    strokeDasharray="5 5"
                    name="Target"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </>
        )}
      </TabPanel>

      {/* Product Performance Tab */}
      <TabPanel value={tabValue} index={1}>
        <Box display="flex" flexWrap="wrap" gap={3}>
          {/* Category Distribution */}
          <Box flex="1 1 400px">
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Sales by Category
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `KES ${value}`} />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Box>

          {/* Brand Performance */}
          <Box flex="1 1 400px">
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Brand Performance
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={brandPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="brand" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sales" fill="#8884d8" name="Sales (KES)" />
                  <Bar dataKey="units" fill="#82ca9d" name="Units Sold" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Box>
        </Box>

        {/* Top Products Table */}
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Top Selling Products
          </Typography>
          <Box sx={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Product</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Brand</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Units Sold</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Revenue</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Stock</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.slice(0, 5).map((product, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '12px' }}>{product.name}</td>
                    <td style={{ padding: '12px' }}>{product.brand}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>{product.unitsSold}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>KES {product.revenue.toLocaleString()}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>{product.stock}</td>
                  </tr>
                ))}
                {topProducts.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#666' }}>
                      No product data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Box>
        </Paper>
      </TabPanel>

      {/* Inventory Analysis Tab */}
      <TabPanel value={tabValue} index={2}>
        {inventoryAnalysis && (
          <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Total Inventory Value
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  KES {inventoryAnalysis.totalValue.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Across {inventoryAnalysis.totalItems} items
                </Typography>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Low Stock Items
                </Typography>
                <Typography variant="h4" fontWeight="bold" color="warning.main">
                  {inventoryAnalysis.lowStockItems}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Need reordering
                </Typography>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Out of Stock
                </Typography>
                <Typography variant="h4" fontWeight="bold" color="error.main">
                  {inventoryAnalysis.outOfStockItems}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Lost sales potential
                </Typography>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Stock Health
                </Typography>
                <Typography variant="h4" fontWeight="bold" color="success.main">
                  {Math.round(((inventoryAnalysis.totalItems - inventoryAnalysis.outOfStockItems) / inventoryAnalysis.totalItems) * 100)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Items in stock
                </Typography>
              </CardContent>
            </Card>
          </Box>
        )}
      </TabPanel>

      {/* Financial Summary Tab */}
      <TabPanel value={tabValue} index={3}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Revenue & Profit Trend (Last 6 Months)
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `KES ${value}`} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#2563eb" 
                strokeWidth={2}
                name="Revenue"
              />
              <Line 
                type="monotone" 
                dataKey="profit" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Profit"
              />
            </LineChart>
          </ResponsiveContainer>
        </Paper>
      </TabPanel>
    </Box>
  );
}