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
} from '@mui/material';
import {
  Add,
  Search,
  Edit,
  Delete,
  Inventory,
} from '@mui/icons-material';
import type { Product } from '../../services/productService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import AddProductDialog from '../../components/products/AddProductDialog';
import EditProductDialog from '../../components/products/EditProductDialog';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Use mock data for now (replace with real API call)
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
        {
          id: 4,
          name: 'Clarks Desert Boot',
          category: 'Formal',
          brand: 'Clarks',
          size: '44',
          color: 'Brown',
          purchase_price: 100,
          retail_price: 180,
          wholesale_price: 150,
          supplier: 'Clarks Direct',
          sku: 'CL-FOR-001',
          current_stock: 12,
        },
        {
          id: 5,
          name: 'Nike Revolution 6',
          category: 'Running',
          brand: 'Nike',
          size: '40',
          color: 'Gray',
          purchase_price: 50,
          retail_price: 75,
          wholesale_price: 65,
          supplier: 'Nike Store',
          sku: 'NK-RUN-002',
          current_stock: 25,
        },
      ];
      
      setProducts(mockProducts);
      setFilteredProducts(mockProducts);
    } catch (err: any) {
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    // Filter products based on search term
    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.color.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
    setPage(0); // Reset to first page on search
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

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: 'Out of Stock', color: 'error' as const };
    if (stock < 10) return { label: 'Low Stock', color: 'warning' as const };
    return { label: 'In Stock', color: 'success' as const };
  };

  const handleDeleteProduct = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        // Mock delete - in real app, call productService.delete(id)
        setProducts(products.filter(p => p.id !== id));
        setFilteredProducts(filteredProducts.filter(p => p.id !== id));
      } catch (err: any) {
        setError(err.message || 'Failed to delete product');
      }
    }
  };

  if (loading) return <LoadingSpinner message="Loading products..." />;
  if (error) return <ErrorAlert error={error} onRetry={fetchProducts} />;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Products
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setAddDialogOpen(true)}
        >
          Add Product
        </Button>
      </Box>

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
                    <TableCell align="right">${product.purchase_price}</TableCell>
                    <TableCell align="right">${product.retail_price}</TableCell>
                    <TableCell align="right">${product.wholesale_price}</TableCell>
                    <TableCell align="center">
                      <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                        <Typography>{product.current_stock}</Typography>
                        <Chip
                          label={stockStatus.label}
                          color={stockStatus.color}
                          size="small"
                        />
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Edit">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => handleEditProduct(product)}
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Manage Stock">
                        <IconButton size="small" color="info">
                          <Inventory />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
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
            {filteredProducts.length === 0 && (
              <TableRow>
                <TableCell colSpan={11} align="center">
                  <Typography color="text.secondary" sx={{ py: 3 }}>
                    No products found
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
        onSuccess={fetchProducts}
      />

      {/* Edit Product Dialog */}
      <EditProductDialog
        open={editDialogOpen}
        product={selectedProduct}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedProduct(null);
        }}
        onSuccess={fetchProducts}
      />
    </Box>
  );
}