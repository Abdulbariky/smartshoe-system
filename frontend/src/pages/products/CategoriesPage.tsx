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
import { Add, Edit, Delete, Category as CategoryIcon } from '@mui/icons-material';
import type { Category } from '../../services/categoryService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Mock data for now
      const mockCategories: Category[] = [
        { id: 1, name: 'Sneakers', description: 'Sports and casual sneakers' },
        { id: 2, name: 'Office Shoes', description: 'Formal office footwear' },
        { id: 3, name: 'Sandals', description: 'Open-toe sandals' },
        { id: 4, name: "Kids' Shoes", description: "Children's footwear" },
        { id: 5, name: 'Running', description: 'Professional running shoes' },
      ];
      
      setCategories(mockCategories);
    } catch (err: any) {
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
  };

  const handleSaveCategory = async () => {
    try {
      if (editMode && currentCategory) {
        // Mock update
        setCategories(categories.map(c => 
          c.id === currentCategory.id 
            ? { ...c, name: categoryForm.name, description: categoryForm.description } 
            : c
        ));
      } else {
        // Mock add
        const newCat: Category = {
          id: categories.length + 1,
          name: categoryForm.name,
          description: categoryForm.description,
        };
        setCategories([...categories, newCat]);
      }
      handleCloseDialog();
    } catch (err: any) {
      setError(err.message || 'Failed to save category');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        // Mock delete
        setCategories(categories.filter(c => c.id !== id));
      } catch (err: any) {
        setError(err.message || 'Failed to delete category');
      }
    }
  };

  if (loading) return <LoadingSpinner message="Loading categories..." />;
  if (error) return <ErrorAlert error={error} onRetry={fetchCategories} />;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <CategoryIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h4" fontWeight="bold">
            Product Categories
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Add Category
        </Button>
      </Box>

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
                <TableCell>{category.description}</TableCell>
                <TableCell align="center">
                  <Tooltip title="Edit">
                    <IconButton 
                      size="small" 
                      color="primary"
                      onClick={() => handleOpenDialog(category)}
                    >
                      <Edit />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={() => handleDeleteCategory(category.id)}
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

      {/* Add/Edit Category Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? 'Edit Category' : 'Add New Category'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="Category Name"
              value={categoryForm.name}
              onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
              required
              autoFocus
            />
            <TextField
              fullWidth
              label="Description"
              value={categoryForm.description}
              onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleSaveCategory}
            disabled={!categoryForm.name.trim()}
          >
            {editMode ? 'Update' : 'Add'} Category
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}