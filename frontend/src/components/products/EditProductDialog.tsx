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
import { productService } from '../../services/productService';
import { categoryService, brandService } from '../../services/categoryService';
import type { Category, Brand } from '../../services/categoryService';
import type { Product } from '../../services/productService';

const schema = yup.object({
  name: yup.string().required('Product name is required'),
  category: yup.string().required('Category is required'),
  brand: yup.string().required('Brand is required'),
  size: yup.string().required('Size is required'),
  color: yup.string().required('Color is required'),
  purchase_price: yup
    .number()
    .typeError('Purchase price must be a number')
    .positive('Must be positive')
    .required('Purchase price is required'),
  retail_price: yup
    .number()
    .typeError('Retail price must be a number')
    .positive('Must be positive')
    .required('Retail price is required'),
  wholesale_price: yup
    .number()
    .typeError('Wholesale price must be a number')
    .positive('Must be positive')
    .required('Wholesale price is required'),
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
  const [loadingData, setLoadingData] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    if (open && product) {
      reset({
        name: product.name,
        category: product.category,
        brand: product.brand,
        size: product.size,
        color: product.color,
        purchase_price: product.purchase_price,
        retail_price: product.retail_price,
        wholesale_price: product.wholesale_price,
        supplier: product.supplier || '',
      });
      
      loadCategoriesAndBrands();
    }
  }, [open, product, reset]);

  const loadCategoriesAndBrands = async () => {
    try {
      setLoadingData(true);
      setError('');
      console.log('🔄 Loading categories and brands from API...');

      const [categoriesData, brandsData] = await Promise.all([
        categoryService.getAll(),
        brandService.getAll()
      ]);

      console.log('✅ Categories loaded:', categoriesData);
      console.log('✅ Brands loaded:', brandsData);

      setCategories(categoriesData);
      setBrands(brandsData);
    } catch (err: any) {
      console.error('❌ Failed to load categories and brands:', err);
      setError('Failed to load categories and brands. Please try again.');
    } finally {
      setLoadingData(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!product) return;

    try {
      setLoading(true);
      setError('');
      console.log('🔄 Updating product:', product.id, data);

      await productService.update(product.id, data);
      console.log('✅ Product updated successfully');

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('❌ Failed to update product:', err);
      setError(err.message || 'Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  if (!product) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>Edit Product</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {loadingData && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Loading categories and brands...
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="Product Name"
              {...register('name')}
              error={!!errors.name}
              helperText={errors.name?.message}
              disabled={loading}
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                select
                label="Brand"
                {...register('brand')}
                error={!!errors.brand}
                helperText={errors.brand?.message}
                disabled={loading || loadingData}
              >
                <MenuItem value="">Select Brand</MenuItem>
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
                {...register('category')}
                error={!!errors.category}
                helperText={errors.category?.message}
                disabled={loading || loadingData}
              >
                <MenuItem value="">Select Category</MenuItem>
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
                {...register('size')}
                error={!!errors.size}
                helperText={errors.size?.message}
                disabled={loading}
              >
                {sizes.map((size) => (
                  <MenuItem key={size} value={size}>
                    {size}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                fullWidth
                select
                label="Color"
                {...register('color')}
                error={!!errors.color}
                helperText={errors.color?.message}
                disabled={loading}
              >
                {colors.map((color) => (
                  <MenuItem key={color} value={color}>
                    {color}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <TextField
              fullWidth
              label="Supplier"
              {...register('supplier')}
              error={!!errors.supplier}
              helperText={errors.supplier?.message}
              disabled={loading}
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                type="number"
                label="Purchase Price (KES)"
                {...register('purchase_price', { valueAsNumber: true })}
                error={!!errors.purchase_price}
                helperText={errors.purchase_price?.message}
                disabled={loading}
              />

              <TextField
                fullWidth
                type="number"
                label="Retail Price (KES)"
                {...register('retail_price', { valueAsNumber: true })}
                error={!!errors.retail_price}
                helperText={errors.retail_price?.message}
                disabled={loading}
              />

              <TextField
                fullWidth
                type="number"
                label="Wholesale Price (KES)"
                {...register('wholesale_price', { valueAsNumber: true })}
                error={!!errors.wholesale_price}
                helperText={errors.wholesale_price?.message}
                disabled={loading}
              />
            </Box>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading || loadingData}
          >
            {loading ? 'Updating...' : 'Update Product'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}