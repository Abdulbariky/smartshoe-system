import { useState } from 'react';
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
} from '@mui/icons-material';

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

  // Mock data for charts
  const salesData = [
    { name: 'Mon', sales: 4000, target: 3500 },
    { name: 'Tue', sales: 3000, target: 3500 },
    { name: 'Wed', sales: 5000, target: 3500 },
    { name: 'Thu', sales: 2780, target: 3500 },
    { name: 'Fri', sales: 1890, target: 3500 },
    { name: 'Sat', sales: 6390, target: 3500 },
    { name: 'Sun', sales: 3490, target: 3500 },
  ];

  const categoryData = [
    { name: 'Sneakers', value: 400, color: '#0088FE' },
    { name: 'Running', value: 300, color: '#00C49F' },
    { name: 'Formal', value: 200, color: '#FFBB28' },
    { name: 'Casual', value: 150, color: '#FF8042' },
    { name: 'Sandals', value: 100, color: '#8884D8' },
  ];

  const brandPerformance = [
    { brand: 'Nike', sales: 12000, units: 100 },
    { brand: 'Adidas', sales: 9000, units: 75 },
    { brand: 'Puma', sales: 6000, units: 50 },
    { brand: 'Clarks', sales: 4500, units: 25 },
    { brand: 'Bata', sales: 3000, units: 30 },
  ];

  const monthlyTrend = [
    { month: 'Jan', revenue: 45000, profit: 12000 },
    { month: 'Feb', revenue: 52000, profit: 14000 },
    { month: 'Mar', revenue: 48000, profit: 13000 },
    { month: 'Apr', revenue: 61000, profit: 16000 },
    { month: 'May', revenue: 55000, profit: 15000 },
    { month: 'Jun', revenue: 67000, profit: 18000 },
  ];

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Reports & Analytics
        </Typography>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Period</InputLabel>
          <Select
            value={period}
            label="Period"
            onChange={(e) => setPeriod(e.target.value)}
          >
            <MenuItem value="day">Today</MenuItem>
            <MenuItem value="week">This Week</MenuItem>
            <MenuItem value="month">This Month</MenuItem>
            <MenuItem value="year">This Year</MenuItem>
          </Select>
        </FormControl>
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
        {/* Summary Cards */}
        <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={3} mb={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Sales
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                $26,350
              </Typography>
              <Typography variant="body2" color="success.main">
                +12% from last week
              </Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Transactions
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                156
              </Typography>
              <Typography variant="body2" color="success.main">
                +8% from last week
              </Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Average Sale
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                $169
              </Typography>
              <Typography variant="body2" color="error.main">
                -3% from last week
              </Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Target Achievement
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                87%
              </Typography>
              <Typography variant="body2" color="info.main">
                $3,150 to target
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Sales Chart */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Daily Sales vs Target
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
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
                  <Tooltip />
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
                  <Bar dataKey="sales" fill="#8884d8" name="Sales ($)" />
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
                <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '12px' }}>Nike Air Max</td>
                  <td style={{ padding: '12px' }}>Nike</td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>45</td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>$5,400</td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>15</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '12px' }}>Adidas Ultraboost</td>
                  <td style={{ padding: '12px' }}>Adidas</td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>38</td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>$5,320</td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>22</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '12px' }}>Puma Suede Classic</td>
                  <td style={{ padding: '12px' }}>Puma</td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>28</td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>$2,660</td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>8</td>
                </tr>
              </tbody>
            </table>
          </Box>
        </Paper>
      </TabPanel>

      {/* Inventory Analysis Tab */}
      <TabPanel value={tabValue} index={2}>
        <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Inventory Value
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                $125,000
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Across 450 items
              </Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Low Stock Items
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="warning.main">
                12
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
                3
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Lost sales potential
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </TabPanel>

      {/* Financial Summary Tab */}
      <TabPanel value={tabValue} index={3}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Revenue & Profit Trend
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
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