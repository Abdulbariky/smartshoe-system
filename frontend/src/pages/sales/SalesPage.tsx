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
  const [success, setSuccess] = useState('');
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState<any>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    // Mock data - replace with actual API call
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
      {
        id: 3,
        name: 'Puma Suede Classic',
        category: 'Casual',
        brand: 'Puma',
        size: '41',
        color: 'Blue',
        purchase_price: 60,
        retail_price: 95,
        wholesale_price: 80,
        supplier: 'Puma Distributor',
        sku: 'PM-CAS-001',
        current_stock: 8,
      },
    ];
    
    setProducts(mockProducts);
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const addToCart = () => {
    if (!selectedProduct) return;

    const existingItem = cart.find(item => item.product.id === selectedProduct.id);
    
    if (existingItem) {
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
  };

  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
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
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.subtotal, 0);
  };

  const completeSale = async () => {
    if (cart.length === 0) return;

    setLoading(true);
    try {
      const subtotal = calculateTotal();
      const tax = subtotal * 0.1; // 10% tax
      const total = subtotal + tax;
      
      // Create invoice data
      const invoiceData = {
        invoice_number: `INV-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}${new Date().getDate().toString().padStart(2, '0')}-${Math.random().toString(36).substr(2, 3).toUpperCase()}`,
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
      setSuccess('Sale completed successfully!');
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      console.error('Failed to complete sale:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" mb={3}>
        Sales Management
      </Typography>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
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
              options={products}
              getOptionLabel={(option) => `${option.name} - ${option.brand} (${option.size}, ${option.color})`}
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
                          <TableCell align="right">${item.unitPrice}</TableCell>
                          <TableCell align="right">${item.subtotal}</TableCell>
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
                    ${calculateTotal().toFixed(2)}
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