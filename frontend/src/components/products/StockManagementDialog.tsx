import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  Chip,
} from '@mui/material';
import { inventoryService } from '../../services/inventoryService';
import type { Product } from '../../services/productService';

interface StockManagementDialogProps {
  open: boolean;
  product: Product | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function StockManagementDialog({ 
  open, 
  product, 
  onClose, 
  onSuccess 
}: StockManagementDialogProps) {
  const [quantity, setQuantity] = useState<number>(0);
  const [batchNumber, setBatchNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAddStock = async () => {
    if (!product || quantity <= 0) {
      setError('Please enter a valid quantity');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await inventoryService.stockIn({
        product_id: product.id,
        quantity,
        batch_number: batchNumber || `BATCH-${Date.now()}`,
        notes: notes || `Stock added for ${product.name}`,
      });

      onSuccess();
      onClose();
      
      // Reset form
      setQuantity(0);
      setBatchNumber('');
      setNotes('');
    } catch (err: any) {
      setError(err.message || 'Failed to add stock');
    } finally {
      setLoading(false);
    }
  };

  if (!product) return null;

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: 'Out of Stock', color: 'error' as const };
    if (stock < 10) return { label: 'Low Stock', color: 'warning' as const };
    return { label: 'In Stock', color: 'success' as const };
  };

  const stockStatus = getStockStatus(product.current_stock);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Manage Stock - {product.name}
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Current Stock Information
          </Typography>
          <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
            <Typography variant="h6">
              Current Stock: <strong>{product.current_stock}</strong>
            </Typography>
            <Chip
              label={stockStatus.label}
              color={stockStatus.color}
              size="small"
            />
          </Box>
          <Typography variant="body2" color="text.secondary" mt={1}>
            {product.brand} | Size: {product.size} | {product.color}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            fullWidth
            type="number"
            label="Quantity to Add"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            inputProps={{ min: 1 }}
            required
            disabled={loading}
          />

          <TextField
            fullWidth
            label="Batch Number (Optional)"
            value={batchNumber}
            onChange={(e) => setBatchNumber(e.target.value)}
            placeholder="e.g., BATCH-2024-001"
            disabled={loading}
          />

          <TextField
            fullWidth
            label="Notes (Optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            multiline
            rows={2}
            placeholder="Additional notes about this stock addition..."
            disabled={loading}
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          variant="contained" 
          onClick={handleAddStock}
          disabled={quantity <= 0 || loading}
        >
          {loading ? 'Adding Stock...' : `Add ${quantity} Items`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}