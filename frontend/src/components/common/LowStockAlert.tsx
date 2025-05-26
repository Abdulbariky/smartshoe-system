import { useState, useEffect } from 'react';
import {
  Snackbar,
  Alert,
  AlertTitle,
  IconButton,
} from '@mui/material';
import { Close } from '@mui/icons-material';

interface LowStockItem {
  id: number;
  name: string;
  stock: number;
}

export default function LowStockAlert() {
  const [open, setOpen] = useState(false);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);

  useEffect(() => {
    // Check for low stock items every minute
    const checkLowStock = () => {
      // Mock check - replace with actual API call
      const items = [
        { id: 1, name: 'Nike Air Max', stock: 3 },
        { id: 2, name: 'Puma Suede', stock: 2 },
      ];
      
      if (items.length > 0) {
        setLowStockItems(items);
        setOpen(true);
      }
    };

    checkLowStock();
    const interval = setInterval(checkLowStock, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, []);

  const handleClose = () => {
    setOpen(false);
  };

  if (lowStockItems.length === 0) return null;

  return (
    <Snackbar
      open={open}
      autoHideDuration={10000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert
        severity="warning"
        onClose={handleClose}
        action={
          <IconButton size="small" color="inherit" onClick={handleClose}>
            <Close fontSize="small" />
          </IconButton>
        }
      >
        <AlertTitle>Low Stock Alert!</AlertTitle>
        {lowStockItems.map(item => (
          <div key={item.id}>
            {item.name}: Only {item.stock} left
          </div>
        ))}
      </Alert>
    </Snackbar>
  );
}