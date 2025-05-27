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
import { Add, Edit, Delete, Category as CategoryIcon, Refresh } from '@mui/icons-material';
import { categoryService, type Category } from '../../services/categoryService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('🔄 Fetching categories from API...');
      
      const data = await categoryService.getAll();
      console.log('✅ Categories loaded:', data);
      
      setCategories(data);
      
      if (data.length === 0) {
        setError('No categories found. Add some categories to get started!');
      }
    } catch (err: any) {
      console.error('❌ Failed to load categories:', err);
      setError(err.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditMode(true);
      setCurrentCategory(category);
      setCategoryForm({ name: category.name, description: category.description || '' });
    } else {
      setEditMode(false);
      setCurrentCategory(null);
      setCategoryForm({ name: '', description: '' });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditMode(false);
    setCurrentCategory(null);
    setCategoryForm({ name: '', description: '' });
    setError('');
  };

  const handleSaveCategory = async () => {
    if (!categoryForm.name.trim()) {
      setError('Category name is required');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      
      if (editMode && currentCategory) {
        console.log('🔄 Updating category:', currentCategory.id, categoryForm);
        await categoryService.update(currentCategory.id, categoryForm);
        setSuccess('Category updated successfully!');
      } else {
        console.log('🔄 Adding new category:', categoryForm);
        await categoryService.add(categoryForm);
        setSuccess('Category added successfully!');
      }
      
      handleCloseDialog();
      await fetchCategories(); // Refresh the list
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('❌ Failed to save category:', err);
      setError(err.message || 'Failed to save category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        setLoading(true);
        console.log('🔄 Deleting category:', id);
        
        await categoryService.delete(id);
        setSuccess('Category deleted successfully!');
        await fetchCategories(); // Refresh the list
        setTimeout(() => setSuccess(''), 3000);
      } catch (err: any) {
        console.error('❌ Failed to delete category:', err);
        setError(err.message || 'Failed to delete category');
        setTimeout(() => setError(''), 5000);
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading && categories.length === 0) {
    return <LoadingSpinner message="Loading categories..." />;
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <CategoryIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h4" fontWeight="bold">
            Product Categories ({categories.length})
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            startIcon={<Refresh />}
            onClick={fetchCategories}
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
            Add Category
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
              <TableCell>Category Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell>{category.id}</TableCell>
                <TableCell>
                  <Typography fontWeight="medium">{category.name}</Typography>
                </TableCell>
                <TableCell>{category.description || '-'}</TableCell>
                <TableCell align="center">
                  <Tooltip title="Edit">
                    <IconButton 
                      size="small" 
                      color="primary"
                      onClick={() => handleOpenDialog(category)}
                      disabled={loading}
                    >
                      <Edit />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={() => handleDeleteCategory(category.id)}
                      disabled={loading}
                    >
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {categories.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Typography color="text.secondary" sx={{ py: 3 }}>
                    No categories found. Add some categories to get started!
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Category Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? 'Edit Category' : 'Add New Category'}</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="Category Name"
              value={categoryForm.name}
              onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
              required
              autoFocus
              disabled={submitting}
            />
            <TextField
              fullWidth
              label="Description"
              value={categoryForm.description}
              onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
              multiline
              rows={2}
              disabled={submitting}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={submitting}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSaveCategory}
            disabled={!categoryForm.name.trim() || submitting}
          >
            {submitting ? 'Saving...' : (editMode ? 'Update' : 'Add')} Category
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}