import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  MenuItem,
  Alert,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add,
  History,
  TrendingUp,
  TrendingDown,
  Refresh,
} from '@mui/icons-material';
import type { Product } from '../../services/productService';
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
      id={`tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

interface InventoryTransaction {
  id: number;
  product_id: number;
  product_name: string;
  transaction_type: 'in' | 'out';
  quantity: number;
  batch_number?: string;
  notes?: string;
  created_at: string;
}

export default function InventoryPage() {
  const [tabValue, setTabValue] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Stock In Form
  const [selectedProduct, setSelectedProduct] = useState<number | ''>('');
  const [quantity, setQuantity] = useState<number>(0);
  const [batchNumber, setBatchNumber] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Mock data
      const mockProducts: Product[] = [
        {
          id: 1,
          name: 'Nike Air Max',
          category: 'Sneakers',
          brand: 'Nike',
          size: '42',
          color: 'White',
          purchase_price: 80,
          retail_price: 120,
          wholesale_price: 100,
          supplier: 'Nike Store',
          sku: 'NK-SNK-001',
          current_stock: 45,
        },
        {
          id: 2,
          name: 'Adidas Ultraboost',
          category: 'Running',
          brand: 'Adidas',
          size: '43',
          color: 'Black',
          purchase_price: 90,
          retail_price: 140,
          wholesale_price: 120,
          supplier: 'Adidas Official',
          sku: 'AD-RUN-001',
          current_stock: 30,
        },
      ];

      const mockTransactions: InventoryTransaction[] = [
        {
          id: 1,
          product_id: 1,
          product_name: 'Nike Air Max',
          transaction_type: 'in',
          quantity: 50,
          batch_number: 'BATCH-001',
          notes: 'Initial stock',
          created_at: '2024-01-20T10:00:00',
        },
        {
          id: 2,
          product_id: 1,
          product_name: 'Nike Air Max',
          transaction_type: 'out',
          quantity: 5,
          notes: 'Sale: INV-001',
          created_at: '2024-01-20T14:30:00',
        },
        {
          id: 3,
          product_id: 2,
          product_name: 'Adidas Ultraboost',
          transaction_type: 'in',
          quantity: 30,
          batch_number: 'BATCH-002',
          notes: 'New shipment',
          created_at: '2024-01-19T09:00:00',
        },
      ];

      setProducts(mockProducts);
      setTransactions(mockTransactions);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleStockIn = async () => {
    if (!selectedProduct || quantity <= 0) {
      setError('Please select a product and enter quantity');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Mock API call
      const newTransaction: InventoryTransaction = {
        id: transactions.length + 1,
        product_id: selectedProduct as number,
        product_name: products.find(p => p.id === selectedProduct)?.name || '',
        transaction_type: 'in',
        quantity,
        batch_number: batchNumber,
        notes,
        created_at: new Date().toISOString(),
      };

      setTransactions([newTransaction, ...transactions]);
      
      // Update product stock
      setProducts(products.map(p => 
        p.id === selectedProduct 
          ? { ...p, current_stock: p.current_stock + quantity }
          : p
      ));

      // Reset form
      setSelectedProduct('');
      setQuantity(0);
      setBatchNumber('');
      setNotes('');
      setSuccess('Stock added successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to add stock');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) return <LoadingSpinner message="Loading inventory..." />;
  if (error) return <ErrorAlert error={error} onRetry={fetchData} />;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Inventory Management
        </Typography>
        <Button
          startIcon={<Refresh />}
          onClick={fetchData}
          variant="outlined"
        >
          Refresh
        </Button>
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab icon={<Add />} label="Stock In" />
          <Tab icon={<History />} label="Transaction History" />
          <Tab icon={<TrendingUp />} label="Stock Levels" />
        </Tabs>
      </Paper>

      {/* Stock In Tab */}
      <TabPanel value={tabValue} index={0}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Add Stock
          </Typography>
          
          <Box display="flex" flexDirection="column" gap={2} maxWidth={600}>
            <TextField
              select
              label="Select Product"
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(Number(e.target.value))}
              required
            >
              <MenuItem value="">
                <em>Select a product</em>
              </MenuItem>
              {products.map((product) => (
                <MenuItem key={product.id} value={product.id}>
                  {product.name} - {product.brand} ({product.size}, {product.color})
                </MenuItem>
              ))}
            </TextField>

            <TextField
              type="number"
              label="Quantity"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              required
              inputProps={{ min: 1 }}
            />

            <TextField
              label="Batch Number"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
              placeholder="e.g., BATCH-2024-001"
            />

            <TextField
              label="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              multiline
              rows={2}
              placeholder="Additional notes..."
            />

            <Button
              variant="contained"
              size="large"
              startIcon={<Add />}
              onClick={handleStockIn}
              disabled={!selectedProduct || quantity <= 0}
            >
              Add Stock
            </Button>
          </Box>
        </Paper>
      </TabPanel>

      {/* Transaction History Tab */}
      <TabPanel value={tabValue} index={1}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date & Time</TableCell>
                <TableCell>Product</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="right">Quantity</TableCell>
                <TableCell>Batch Number</TableCell>
                <TableCell>Notes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{formatDate(transaction.created_at)}</TableCell>
                  <TableCell>{transaction.product_name}</TableCell>
                  <TableCell>
                    <Chip
                      icon={transaction.transaction_type === 'in' ? <TrendingUp /> : <TrendingDown />}
                      label={transaction.transaction_type === 'in' ? 'Stock In' : 'Stock Out'}
                      color={transaction.transaction_type === 'in' ? 'success' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography
                      color={transaction.transaction_type === 'in' ? 'success.main' : 'warning.main'}
                      fontWeight="medium"
                    >
                      {transaction.transaction_type === 'in' ? '+' : '-'}{transaction.quantity}
                    </Typography>
                  </TableCell>
                  <TableCell>{transaction.batch_number || '-'}</TableCell>
                  <TableCell>{transaction.notes || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Stock Levels Tab */}
      <TabPanel value={tabValue} index={2}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell>Brand</TableCell>
                <TableCell>Size</TableCell>
                <TableCell>Color</TableCell>
                <TableCell align="center">Current Stock</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((product) => {
                const isLowStock = product.current_stock < 10;
                const isOutOfStock = product.current_stock === 0;
                
                return (
                  <TableRow key={product.id}>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.brand}</TableCell>
                    <TableCell>{product.size}</TableCell>
                    <TableCell>{product.color}</TableCell>
                    <TableCell align="center">
                      <Typography
                        fontWeight="bold"
                        color={isOutOfStock ? 'error' : isLowStock ? 'warning.main' : 'success.main'}
                      >
                        {product.current_stock}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={
                          isOutOfStock ? 'Out of Stock' : 
                          isLowStock ? 'Low Stock' : 
                          'In Stock'
                        }
                        color={
                          isOutOfStock ? 'error' : 
                          isLowStock ? 'warning' : 
                          'success'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Quick Stock In">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => {
                            setSelectedProduct(product.id);
                            setTabValue(0);
                          }}
                        >
                          <Add />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>
    </Box>
  );
}