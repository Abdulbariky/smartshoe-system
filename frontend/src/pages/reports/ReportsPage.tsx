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
  Tooltip,
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
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  Assessment,
  Inventory,
  AttachMoney,
  Refresh,
  Info,
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

function MetricCard({ 
  title, 
  value, 
  subtitle, 
  explanation, 
  color = 'primary' 
}: { 
  title: string; 
  value: string | number; 
  subtitle?: string; 
  explanation: string;
  color?: string;
}) {
  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography color="text.secondary" gutterBottom>
                {title}
              </Typography>
              <Tooltip title={explanation} arrow>
                <Info sx={{ fontSize: 16, color: 'text.secondary', cursor: 'help' }} />
              </Tooltip>
            </Box>
            <Typography variant="h4" fontWeight="bold">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary" mt={1}>
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
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

      {/* Sales Overview Tab - FIXED: Removed Target Achievement and Average Sales */}
      <TabPanel value={tabValue} index={0}>
        {salesOverview && (
          <>
            {/* Summary Cards - SIMPLIFIED */}
            <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={3} mb={3}>
              <MetricCard
                title="Total Sales"
                value={`KES ${salesOverview.totalSales.toLocaleString()}`}
                subtitle={`${salesOverview.totalTransactions} transactions`}
                explanation="Total revenue from all completed sales in your selected period. This includes both retail and wholesale sales."
              />
              
              {/* ❌ REMOVED: Average Sale card */}
              
              {/* ❌ REMOVED: Target Achievement card */}
              
              <MetricCard
                title="Transactions"
                value={salesOverview.totalTransactions}
                subtitle="Total completed sales"
                explanation="Number of individual sales transactions completed. Each sale, regardless of amount, counts as one transaction."
              />
            </Box>

            {/* Sales Trend Chart - Updated to remove target line */}
            <Paper sx={{ p: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" gutterBottom>
                  Daily Sales Trend (Last 7 Days)
                </Typography>
                <Tooltip title="Shows actual daily sales from your transaction data. Blue line represents real sales revenue." arrow>
                  <Info sx={{ color: 'text.secondary', cursor: 'help' }} />
                </Tooltip>
              </Box>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip formatter={(value) => `KES ${value}`} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="sales" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    name="Daily Sales"
                  />
                  {/* ❌ REMOVED: Target line */}
                </LineChart>
              </ResponsiveContainer>
              <Typography variant="caption" color="text.secondary" mt={2} display="block">
                📊 This chart shows your actual daily sales performance based on completed transactions in your database.
              </Typography>
            </Paper>
          </>
        )}
      </TabPanel>

      {/* Product Performance Tab */}
      <TabPanel value={tabValue} index={1}>
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>📊 Product Performance Metrics:</strong><br/>
            • <strong>Units Sold:</strong> Actual number of units sold based on your sales data<br/>
            • <strong>Revenue:</strong> Real revenue calculated from completed transactions<br/>
            • <strong>Category Sales:</strong> Distribution of sales across different shoe categories
          </Typography>
        </Alert>

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
                  <RechartsTooltip formatter={(value) => `KES ${value}`} />
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
                  <RechartsTooltip />
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
                  <th style={{ padding: '12px', textAlign: 'right' }}>Current Stock</th>
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

      {/* Inventory Analysis Tab - FIXED: Removed Stock Health */}
      <TabPanel value={tabValue} index={2}>
        {inventoryAnalysis && (
          <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={3}>
            <MetricCard
              title="Total Inventory Value"
              value={`KES ${inventoryAnalysis.totalValue.toLocaleString()}`}
              subtitle={`Across ${inventoryAnalysis.totalItems} items`}
              explanation="Total value of all products in stock, calculated as: (Current Stock × Purchase Price) for each product."
            />
            
            <MetricCard
              title="Low Stock Items"
              value={inventoryAnalysis.lowStockItems}
              subtitle="Need reordering"
              explanation="Number of products with less than 10 items in stock. These products may run out soon and need restocking."
              color="warning"
            />
            
            <MetricCard
              title="Out of Stock"
              value={inventoryAnalysis.outOfStockItems}
              subtitle="Lost sales potential"
              explanation="Number of products with zero stock. These represent lost sales opportunities and should be restocked immediately."
              color="error"
            />
            
            {/* ❌ REMOVED: Stock Health card */}
          </Box>
        )}
      </TabPanel>

      {/* Financial Summary Tab */}
      <TabPanel value={tabValue} index={3}>
        <Paper sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" gutterBottom>
              Revenue & Profit Trend (Last 6 Months)
            </Typography>
            <Tooltip title="Revenue is actual sales data. Profit is estimated at 30% of revenue (you can adjust this based on your actual profit margins)." arrow>
              <Info sx={{ color: 'text.secondary', cursor: 'help' }} />
            </Tooltip>
          </Box>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <RechartsTooltip formatter={(value) => `KES ${value}`} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#2563eb" 
                strokeWidth={2}
                name="Revenue (Actual Sales)"
              />
              <Line 
                type="monotone" 
                dataKey="profit" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Estimated Profit (30%)"
              />
            </LineChart>
          </ResponsiveContainer>
          <Typography variant="caption" color="text.secondary" mt={2} display="block">
            💰 <strong>Financial Calculations:</strong><br/>
            • <strong>Revenue:</strong> Your actual sales transactions from the database<br/>
            • <strong>Profit:</strong> Estimated at 30% of revenue (adjust based on your actual margins)<br/>
            • <strong>Calculation:</strong> Profit = Revenue × 0.30
          </Typography>
        </Paper>
      </TabPanel>
    </Box>
  );
}