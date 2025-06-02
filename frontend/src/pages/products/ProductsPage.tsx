import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Tooltip,
  TablePagination,
  Alert,
} from '@mui/material';
import {
  Add,
  Search,
  Edit,
  Delete,
  Inventory,
  Refresh,
} from '@mui/icons-material';
import type { Product } from '../../services/productService';
import { productService } from '../../services/productService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AddProductDialog from '../../components/products/AddProductDialog';
import EditProductDialog from '../../components/products/EditProductDialog';
import StockManagementDialog from '../../components/products/StockManagementDialog';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Fetch products from API
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('🔄 Fetching products from API...');

      const products = await productService.getAll();
      console.log('✅ Products loaded:', products);
      
      setProducts(products);
      setFilteredProducts(products);
      
      if (products.length === 0) {
        setError('No products found. Add some products to get started!');
      }
    } catch (err: any) {
      console.error('❌ Failed to load products:', err);
      setError(err.message || 'Failed to load products. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.color.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
    setPage(0);
  }, [searchTerm, products]);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setEditDialogOpen(true);
  };

  const handleManageStock = (product: Product) => {
    setSelectedProduct(product);
    setStockDialogOpen(true);
  };

  const handleDeleteProduct = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        setLoading(true);
        await productService.delete(id);
        setSuccess('Product deleted successfully!');
        fetchProducts(); // Refresh the list
        setTimeout(() => setSuccess(''), 3000);
      } catch (err: any) {
        setError(err.message || 'Failed to delete product');
        setTimeout(() => setError(''), 5000);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleProductAdded = () => {
    setSuccess('Product added successfully!');
    fetchProducts(); // Refresh the list
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleProductUpdated = () => {
    setSuccess('Product updated successfully!');
    fetchProducts(); // Refresh the list
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleStockUpdated = () => {
    setSuccess('Stock updated successfully!');
    fetchProducts(); // Refresh the list
    setTimeout(() => setSuccess(''), 3000);
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: 'Out of Stock', color: 'error' as const };
    if (stock < 10) return { label: 'Low Stock', color: 'warning' as const };
    return { label: 'In Stock', color: 'success' as const };
  };

  if (loading && products.length === 0) {
    return <LoadingSpinner message="Loading products..." />;
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Products ({filteredProducts.length})
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            startIcon={<Refresh />}
            onClick={fetchProducts}
            variant="outlined"
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setAddDialogOpen(true)}
          >
            Add Product
          </Button>
        </Box>
      </Box>

      {/* Alerts */}
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

      {/* Search Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search products by name, brand, category, SKU, or color..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {/* Products Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>SKU</TableCell>
              <TableCell>Product Name</TableCell>
              <TableCell>Brand</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Size</TableCell>
              <TableCell>Color</TableCell>
              <TableCell align="right">Purchase</TableCell>
              <TableCell align="right">Retail</TableCell>
              <TableCell align="right">Wholesale</TableCell>
              <TableCell align="center">Stock</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredProducts
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((product) => {
                const stockStatus = getStockStatus(product.current_stock);
                return (
                  <TableRow key={product.id} hover>
                    <TableCell>{product.sku}</TableCell>
                    <TableCell>
                      <Typography fontWeight="medium">{product.name}</Typography>
                    </TableCell>
                    <TableCell>{product.brand}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>{product.size}</TableCell>
                    <TableCell>{product.color}</TableCell>
                    <TableCell align="right">KES {product.purchase_price}</TableCell>
                    <TableCell align="right">KES {product.retail_price}</TableCell>
                    <TableCell align="right">KES {product.wholesale_price}</TableCell>
                    <TableCell align="center">
                      <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                        <Typography fontWeight="bold">{product.current_stock}</Typography>
                        <Chip
                          label={stockStatus.label}
                          color={stockStatus.color}
                          size="small"
                        />
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Edit Product">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleEditProduct(product)}
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Manage Stock">
                        <IconButton 
                          size="small" 
                          color="info"
                          onClick={() => handleManageStock(product)}
                        >
                          <Inventory />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Product">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            {filteredProducts.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={11} align="center">
                  <Typography color="text.secondary" sx={{ py: 3 }}>
                    {searchTerm ? 'No products match your search' : 'No products found. Add some products to get started!'}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredProducts.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Add Product Dialog */}
      <AddProductDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onSuccess={handleProductAdded}
      />

      {/* Edit Product Dialog */}
      <EditProductDialog
        open={editDialogOpen}
        product={selectedProduct}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedProduct(null);
        }}
        onSuccess={handleProductUpdated}
      />

      {/* Stock Management Dialog */}
      <StockManagementDialog
        open={stockDialogOpen}
        product={selectedProduct}
        onClose={() => {
          setStockDialogOpen(false);
          setSelectedProduct(null);
        }}
        onSuccess={handleStockUpdated}
      />
    </Box>
  );
}