import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Divider,
  Chip,
  Alert,
  Autocomplete,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add,
  Remove,
  Delete,
  ShoppingCart,
  Receipt,
} from '@mui/icons-material';
import type { Product } from '../../services/productService';
import { productService } from '../../services/productService';
import { salesService, type CreateSaleRequest } from '../../services/salesService';
import SalesHistory from '../../components/sales/SalesHistoryPage';
import InvoiceDialog from '../../components/sales/InvoiceDialog';

interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

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
      id={`sales-tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

export default function SalesPage() {
  const [tabValue, setTabValue] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [saleType, setSaleType] = useState<'retail' | 'wholesale'>('retail');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState<any>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const productsData = await productService.getAll();
      setProducts(productsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load products');
    }
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const addToCart = () => {
    if (!selectedProduct) return;

    // Check if product has enough stock
    if (selectedProduct.current_stock <= 0) {
      setError('Product is out of stock');
      return;
    }

    const existingItem = cart.find(item => item.product.id === selectedProduct.id);

    if (existingItem) {
      // Check if adding one more would exceed stock
      if (existingItem.quantity >= selectedProduct.current_stock) {
        setError(`Not enough stock. Available: ${selectedProduct.current_stock}`);
        return;
      }
      // Update quantity if product already in cart
      updateQuantity(existingItem.product.id, existingItem.quantity + 1);
    } else {
      // Add new item to cart
      const unitPrice = saleType === 'retail' ? selectedProduct.retail_price : selectedProduct.wholesale_price;
      const newItem: CartItem = {
        product: selectedProduct,
        quantity: 1,
        unitPrice,
        subtotal: unitPrice,
      };
      setCart([...cart, newItem]);
    }

    setSelectedProduct(null);
    setError(''); // Clear any previous errors
  };

  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    // Check stock availability
    const product = products.find(p => p.id === productId);
    if (product && newQuantity > product.current_stock) {
      setError(`Not enough stock for ${product.name}. Available: ${product.current_stock}`);
      return;
    }

    setCart(cart.map(item => {
      if (item.product.id === productId) {
        const unitPrice = saleType === 'retail' ? item.product.retail_price : item.product.wholesale_price;
        return {
          ...item,
          quantity: newQuantity,
          unitPrice,
          subtotal: unitPrice * newQuantity,
        };
      }
      return item;
    }));
    setError(''); // Clear any previous errors
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.subtotal, 0);
  };

  const completeSale = async () => {
    if (cart.length === 0) {
      setError('Cart is empty');
      return;
    }

    setLoading(true);
    try {
      const saleData: CreateSaleRequest = {
        items: cart.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.unitPrice
        })),
        sale_type: saleType,
        payment_method: 'cash' // You can make this configurable
      };

      const response = await salesService.createSale(saleData);

      // Create invoice data for dialog
      const subtotal = calculateTotal();
      const tax = subtotal * 0.1; // 10% tax
      const total = subtotal + tax;

      const invoiceData = {
        invoice_number: response.invoice_number,
        date: new Date().toLocaleString(),
        sale_type: saleType,
        items: cart.map(item => ({
          product_name: `${item.product.name} - ${item.product.brand} (${item.product.size}, ${item.product.color})`,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          subtotal: item.subtotal,
        })),
        subtotal,
        tax,
        total,
        payment_method: 'cash',
      };

      // Set invoice data and open dialog
      setCurrentInvoice(invoiceData);
      setInvoiceDialogOpen(true);

      // Clear cart and show success
      setCart([]);
      setSuccess(`Sale completed successfully! Invoice: ${response.invoice_number}`);
      
      // Refresh products to get updated stock
      await fetchProducts();
      
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to complete sale');
    } finally {
      setLoading(false);
    }
  };

  // Filter products that are in stock for the autocomplete
  const availableProducts = products.filter(product => product.current_stock > 0);

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" mb={3}>
        Sales Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Point of Sale" />
          <Tab label="Sales History" />
        </Tabs>
      </Paper>

      <TabPanel value={tabValue} index={0}>
        <Box display="flex" gap={3}>
          {/* Product Selection */}
          <Paper sx={{ flex: 1, p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Add Products
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Sale Type
              </Typography>
              <Box display="flex" gap={1}>
                <Chip
                  label="Retail"
                  color={saleType === 'retail' ? 'primary' : 'default'}
                  onClick={() => setSaleType('retail')}
                />
                <Chip
                  label="Wholesale"
                  color={saleType === 'wholesale' ? 'primary' : 'default'}
                  onClick={() => setSaleType('wholesale')}
                />
              </Box>
            </Box>

            <Autocomplete
              options={availableProducts}
              getOptionLabel={(option) => `${option.name} - ${option.brand} (${option.size}, ${option.color}) - Stock: ${option.current_stock}`}
              value={selectedProduct}
              onChange={(_, value) => setSelectedProduct(value)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Search Product"
                  placeholder="Type to search..."
                  fullWidth
                  margin="normal"
                />
              )}
              isOptionEqualToValue={(option, value) => option.id === value.id}
            />

            <Button
              variant="contained"
              fullWidth
              startIcon={<Add />}
              onClick={addToCart}
              disabled={!selectedProduct}
              sx={{ mt: 2 }}
            >
              Add to Cart
            </Button>
          </Paper>

          {/* Shopping Cart */}
          <Paper sx={{ flex: 2, p: 3 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="h6">
                Shopping Cart
              </Typography>
              <ShoppingCart />
            </Box>

            {cart.length === 0 ? (
              <Typography color="text.secondary" align="center" py={4}>
                Cart is empty. Add products to start.
              </Typography>
            ) : (
              <>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell align="center">Quantity</TableCell>
                        <TableCell align="right">Unit Price</TableCell>
                        <TableCell align="right">Subtotal</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {cart.map((item) => (
                        <TableRow key={item.product.id}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {item.product.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.product.brand} | Size: {item.product.size} | {item.product.color}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Box display="flex" alignItems="center" justifyContent="center">
                              <IconButton
                                size="small"
                                onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              >
                                <Remove />
                              </IconButton>
                              <Typography sx={{ mx: 1 }}>{item.quantity}</Typography>
                              <IconButton
                                size="small"
                                onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                disabled={item.quantity >= item.product.current_stock}
                              >
                                <Add />
                              </IconButton>
                            </Box>
                          </TableCell>
                          <TableCell align="right">KES {item.unitPrice.toFixed(2)}</TableCell>
                          <TableCell align="right">KES {item.subtotal.toFixed(2)}</TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => removeFromCart(item.product.id)}
                            >
                              <Delete />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Divider sx={{ my: 2 }} />

                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">Total</Typography>
                  <Typography variant="h5" fontWeight="bold">
                    KES {calculateTotal().toFixed(2)}
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  color="success"
                  fullWidth
                  size="large"
                  startIcon={<Receipt />}
                  onClick={completeSale}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Complete Sale'}
                </Button>
              </>
            )}
          </Paper>
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <SalesHistory />
      </TabPanel>

      {/* Invoice Dialog */}
      <InvoiceDialog
        open={invoiceDialogOpen}
        onClose={() => setInvoiceDialogOpen(false)}
        invoiceData={currentInvoice}
      />
    </Box>
  );
}