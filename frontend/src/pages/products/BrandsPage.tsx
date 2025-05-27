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
  Alert,
} from '@mui/material';
import { Add, Edit, Delete, LocalOffer, Refresh } from '@mui/icons-material';
import { brandService, type Brand } from '../../services/categoryService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentBrand, setCurrentBrand] = useState<Brand | null>(null);
  const [brandForm, setBrandForm] = useState({ name: '', country: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('🔄 Fetching brands from API...');
      
      const data = await brandService.getAll();
      console.log('✅ Brands loaded:', data);
      
      setBrands(data);
      
      if (data.length === 0) {
        setError('No brands found. Add some brands to get started!');
      }
    } catch (err: any) {
      console.error('❌ Failed to load brands:', err);
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
      setBrandForm({ name: brand.name, country: brand.country || '' });
    } else {
      setEditMode(false);
      setCurrentBrand(null);
      setBrandForm({ name: '', country: '' });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditMode(false);
    setCurrentBrand(null);
    setBrandForm({ name: '', country: '' });
    setError('');
  };

  const handleSaveBrand = async () => {
    if (!brandForm.name.trim()) {
      setError('Brand name is required');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      
      if (editMode && currentBrand) {
        console.log('🔄 Updating brand:', currentBrand.id, brandForm);
        await brandService.update(currentBrand.id, brandForm);
        setSuccess('Brand updated successfully!');
      } else {
        console.log('🔄 Adding new brand:', brandForm);
        await brandService.add(brandForm);
        setSuccess('Brand added successfully!');
      }
      
      handleCloseDialog();
      await fetchBrands(); // Refresh the list
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('❌ Failed to save brand:', err);
      setError(err.message || 'Failed to save brand');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBrand = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this brand?')) {
      try {
        setLoading(true);
        console.log('🔄 Deleting brand:', id);
        
        await brandService.delete(id);
        setSuccess('Brand deleted successfully!');
        await fetchBrands(); // Refresh the list
        setTimeout(() => setSuccess(''), 3000);
      } catch (err: any) {
        console.error('❌ Failed to delete brand:', err);
        setError(err.message || 'Failed to delete brand');
        setTimeout(() => setError(''), 5000);
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading && brands.length === 0) {
    return <LoadingSpinner message="Loading brands..." />;
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <LocalOffer color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h4" fontWeight="bold">
            Brands ({brands.length})
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            startIcon={<Refresh />}
            onClick={fetchBrands}
            variant="outlined"
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
            Add Brand
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

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Brand Name</TableCell>
              <TableCell>Country</TableCell>
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
                <TableCell>{brand.country || '-'}</TableCell>
                <TableCell align="center">
                  <Tooltip title="Edit">
                    <IconButton 
                      size="small" 
                      color="primary"
                      onClick={() => handleOpenDialog(brand)}
                      disabled={loading}
                    >
                      <Edit />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={() => handleDeleteBrand(brand.id)}
                      disabled={loading}
                    >
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {brands.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Typography color="text.secondary" sx={{ py: 3 }}>
                    No brands found. Add some brands to get started!
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Brand Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? 'Edit Brand' : 'Add New Brand'}</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="Brand Name"
              value={brandForm.name}
              onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })}
              required
              autoFocus
              disabled={submitting}
            />
            <TextField
              fullWidth
              label="Country (Optional)"
              value={brandForm.country}
              onChange={(e) => setBrandForm({ ...brandForm, country: e.target.value })}
              disabled={submitting}
              placeholder="e.g., USA, Germany, Kenya"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={submitting}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSaveBrand}
            disabled={!brandForm.name.trim() || submitting}
          >
            {submitting ? 'Saving...' : (editMode ? 'Update' : 'Add')} Brand
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}