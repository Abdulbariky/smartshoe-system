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
});

type FormData = yup.InferType<typeof schema>;

// Create a type for the API call that includes SKU and supplier
type ProductCreateData = FormData & { sku: string; supplier: string };

interface AddProductDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const sizes = ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45'];
const colors = ['Black', 'White', 'Blue', 'Red', 'Brown', 'Gray', 'Navy', 'Green'];

export default function AddProductDialog({ open, onClose, onSuccess }: AddProductDialogProps) {
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
    if (open) {
      loadCategoriesAndBrands();
    }
  }, [open]);

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
    try {
      setLoading(true);
      setError('');
      console.log('🔄 Adding product:', data);

      // Create product data with auto-generated SKU and default supplier
      const productData: ProductCreateData = {
        ...data,
        sku: '', // Backend will generate automatically
        supplier: '', // Default empty supplier
      };

      await productService.add(productData as any); // Type assertion for now
      console.log('✅ Product added successfully');

      reset();
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('❌ Failed to add product:', err);
      setError(err.message || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>Add New Product</DialogTitle>
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
                defaultValue=""
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
                defaultValue=""
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
                defaultValue=""
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
                defaultValue=""
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
            {loading ? 'Adding...' : 'Add Product'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}