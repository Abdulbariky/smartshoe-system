import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  MenuItem,
  Alert,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import type { Product } from '../../services/productService';
import type { Category, Brand } from '../../services/categoryService';

const schema = yup.object({
  name: yup.string().required('Product name is required'),
  category: yup.string().required('Category is required'),
  brand: yup.string().required('Brand is required'),
  size: yup.string().required('Size is required'),
  color: yup.string().required('Color is required'),
  purchase_price: yup.number().positive('Must be positive').required('Purchase price is required'),
  retail_price: yup.number().positive('Must be positive').required('Retail price is required'),
  wholesale_price: yup.number().positive('Must be positive').required('Wholesale price is required'),
  supplier: yup.string().required('Supplier is required'),
});

type FormData = yup.InferType<typeof schema>;

interface EditProductDialogProps {
  open: boolean;
  product: Product | null;
  onClose: () => void;
  onSuccess: () => void;
}

const sizes = ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45'];
const colors = ['Black', 'White', 'Blue', 'Red', 'Brown', 'Gray', 'Navy', 'Green'];

export default function EditProductDialog({ open, product, onClose, onSuccess }: EditProductDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  const {
  register,
  handleSubmit,
  formState: { errors },
  setValue,
} = useForm<FormData>({
  resolver: yupResolver(schema),
});

  useEffect(() => {
    if (open && product) {
      // Set form values when dialog opens
      setValue('name', product.name);
      setValue('category', product.category);
      setValue('brand', product.brand);
      setValue('size', product.size);
      setValue('color', product.color);
      setValue('purchase_price', product.purchase_price);
      setValue('retail_price', product.retail_price);
      setValue('wholesale_price', product.wholesale_price);
      setValue('supplier', product.supplier);
      
      loadCategoriesAndBrands();
    }
  }, [open, product, setValue]);

  const loadCategoriesAndBrands = async () => {
    try {
      // Mock data for now
      setCategories([
        { id: 1, name: 'Sneakers', description: 'Sports and casual sneakers' },
        { id: 2, name: 'Running', description: 'Professional running shoes' },
        { id: 3, name: 'Formal', description: 'Office and formal shoes' },
        { id: 4, name: 'Casual', description: 'Everyday casual shoes' },
        { id: 5, name: 'Sandals', description: 'Open-toe sandals' },
      ]);
      
      setBrands([
        { id: 1, name: 'Nike' },
        { id: 2, name: 'Adidas' },
        { id: 3, name: 'Puma' },
        { id: 4, name: 'Clarks' },
        { id: 5, name: 'Bata' },
      ]);
    } catch (err) {
      console.error('Failed to load categories and brands:', err);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!product) return;
    
    try {
      setLoading(true);
      setError('');
      // Mock update - replace with actual API call
      console.log('Updating product:', product.id, data);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>Edit Product</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="Product Name"
              {...register('name')}
              error={!!errors.name}
              helperText={errors.name?.message}
            />
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                select
                label="Brand"
                defaultValue={product?.brand || ''}
                {...register('brand')}
                error={!!errors.brand}
                helperText={errors.brand?.message}
              >
                {brands.map((brand) => (
                  <MenuItem key={brand.id} value={brand.name}>
                    {brand.name}
                  </MenuItem>
                ))}
              </TextField>
              
              <TextField
                fullWidth
                select
                label="Category"
                defaultValue={product?.category || ''}
                {...register('category')}
                error={!!errors.category}
                helperText={errors.category?.message}
              >
                {categories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.name}>
                    {cat.name}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                select
                label="Size"
                defaultValue={product?.size || ''}
                {...register('size')}
                error={!!errors.size}
                helperText={errors.size?.message}
              >
                {sizes.map((size) => (
                  <MenuItem key={size} value={size}>{size}</MenuItem>
                ))}
              </TextField>
              
              <TextField
                fullWidth
                select
                label="Color"
                defaultValue={product?.color || ''}
                {...register('color')}
                error={!!errors.color}
                helperText={errors.color?.message}
              >
                {colors.map((color) => (
                  <MenuItem key={color} value={color}>{color}</MenuItem>
                ))}
              </TextField>
            </Box>
            
            <TextField
              fullWidth
              label="Supplier"
              {...register('supplier')}
              error={!!errors.supplier}
              helperText={errors.supplier?.message}
            />
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                type="number"
                label="Purchase Price"
                {...register('purchase_price', { valueAsNumber: true })}
                error={!!errors.purchase_price}
                helperText={errors.purchase_price?.message}
              />
              
              <TextField
                fullWidth
                type="number"
                label="Retail Price"
                {...register('retail_price', { valueAsNumber: true })}
                error={!!errors.retail_price}
                helperText={errors.retail_price?.message}
              />
              
              <TextField
                fullWidth
                type="number"
                label="Wholesale Price"
                {...register('wholesale_price', { valueAsNumber: true })}
                error={!!errors.wholesale_price}
                helperText={errors.wholesale_price?.message}
              />
            </Box>
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Updating...' : 'Update Product'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}