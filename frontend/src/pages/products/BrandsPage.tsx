import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Add, Edit, Delete, LocalOffer } from '@mui/icons-material';
import type { Brand } from '../../services/categoryService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentBrand, setCurrentBrand] = useState<Brand | null>(null);
  const [brandName, setBrandName] = useState('');

  const fetchBrands = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Mock data for now
      const mockBrands: Brand[] = [
        { id: 1, name: 'Nike' },
        { id: 2, name: 'Adidas' },
        { id: 3, name: 'Puma' },
        { id: 4, name: 'Clarks' },
        { id: 5, name: 'Bata' },
      ];
      
      setBrands(mockBrands);
    } catch (err: any) {
      setError(err.message || 'Failed to load brands');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const handleOpenDialog = (brand?: Brand) => {
    if (brand) {
      setEditMode(true);
      setCurrentBrand(brand);
      setBrandName(brand.name);
    } else {
      setEditMode(false);
      setCurrentBrand(null);
      setBrandName('');
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditMode(false);
    setCurrentBrand(null);
    setBrandName('');
  };

  const handleSaveBrand = async () => {
    try {
      if (editMode && currentBrand) {
        // Mock update
        setBrands(brands.map(b => 
          b.id === currentBrand.id ? { ...b, name: brandName } : b
        ));
      } else {
        // Mock add
        const newBrand: Brand = {
          id: brands.length + 1,
          name: brandName,
        };
        setBrands([...brands, newBrand]);
      }
      handleCloseDialog();
    } catch (err: any) {
      setError(err.message || 'Failed to save brand');
    }
  };

  const handleDeleteBrand = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this brand?')) {
      try {
        // Mock delete
        setBrands(brands.filter(b => b.id !== id));
      } catch (err: any) {
        setError(err.message || 'Failed to delete brand');
      }
    }
  };

  if (loading) return <LoadingSpinner message="Loading brands..." />;
  if (error) return <ErrorAlert error={error} onRetry={fetchBrands} />;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <LocalOffer color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h4" fontWeight="bold">
            Brands
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Add Brand
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Brand Name</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {brands.map((brand) => (
              <TableRow key={brand.id}>
                <TableCell>{brand.id}</TableCell>
                <TableCell>
                  <Typography fontWeight="medium">{brand.name}</Typography>
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Edit">
                    <IconButton 
                      size="small" 
                      color="primary"
                      onClick={() => handleOpenDialog(brand)}
                    >
                      <Edit />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={() => handleDeleteBrand(brand.id)}
                    >
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Brand Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? 'Edit Brand' : 'Add New Brand'}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Brand Name"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              required
              autoFocus
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleSaveBrand}
            disabled={!brandName.trim()}
          >
            {editMode ? 'Update' : 'Add'} Brand
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}