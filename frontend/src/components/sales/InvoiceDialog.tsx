import { useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Paper,
  Chip,
} from '@mui/material';
import { Print, Close } from '@mui/icons-material';
import { useReactToPrint } from 'react-to-print';

interface InvoiceItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface InvoiceData {
  invoice_number: string;
  date: string;
  customer_name?: string;
  sale_type: 'retail' | 'wholesale';
  items: InvoiceItem[];
  total: number;
  payment_method: string;
}

interface InvoiceDialogProps {
  open: boolean;
  onClose: () => void;
  invoiceData: InvoiceData | null;
}

// Helper function to safely format currency
const formatCurrency = (value: number | undefined | null): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0.00';
  }
  return Number(value).toFixed(2);
};

// Helper function to safely get numeric value
const safeNumber = (value: any): number => {
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

export default function InvoiceDialog({ open, onClose, invoiceData }: InvoiceDialogProps) {
  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Invoice-${invoiceData?.invoice_number || 'Document'}`,
    onAfterPrint: () => {
      console.log('✅ Invoice printed successfully');
    },
  });

  if (!invoiceData) return null;

  // Sanitize invoice data to ensure all numeric values are safe
  const safeInvoiceData = {
    ...invoiceData,
    total: safeNumber(invoiceData.total),
    items: (invoiceData.items || []).map(item => ({
      ...item,
      quantity: safeNumber(item.quantity),
      unit_price: safeNumber(item.unit_price),
      subtotal: safeNumber(item.subtotal),
    }))
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Invoice Preview</Typography>
          <Button startIcon={<Print />} variant="contained" onClick={() => handlePrint()}>
            Print Invoice
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box ref={componentRef} sx={{ p: 3, bgcolor: 'white' }}>
          {/* Invoice Header */}
          <Box textAlign="center" mb={3}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              SMARTSHOE
            </Typography>
            <Typography variant="body2" color="text.secondary">
              123 Business Street, Nairobi, Kenya
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Phone: +254 700 123 456 | Email: info@smartshoe.com
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Invoice Details */}
          <Box display="flex" justifyContent="space-between" mb={3}>
            <Box>
              <Typography variant="h6" gutterBottom>
                Bill To:
              </Typography>
              {/* ✅ FIXED: Always show "Walk-in Customer" */}
              <Typography>Walk-in Customer</Typography>
              <Chip
                label={safeInvoiceData.sale_type.toUpperCase()}
                size="small"
                color={safeInvoiceData.sale_type === 'retail' ? 'primary' : 'secondary'}
                sx={{ mt: 1 }}
              />
            </Box>
            <Box textAlign="right">
              <Typography variant="h6" gutterBottom>
                Invoice Details:
              </Typography>
              <Typography>Invoice #: {safeInvoiceData.invoice_number || 'N/A'}</Typography>
              <Typography>Date: {safeInvoiceData.date || new Date().toLocaleString()}</Typography>
              <Typography>Payment: {safeInvoiceData.payment_method || 'Cash'}</Typography>
            </Box>
          </Box>

          {/* Items Table - Matching the user's screenshot exactly */}
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem' }}>Item</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>Quantity</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>Unit Price</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {safeInvoiceData.items.map((item, index) => (
                  <TableRow key={index} sx={{ '&:nth-of-type(even)': { bgcolor: 'grey.50' } }}>
                    <TableCell sx={{ py: 2 }}>
                      <Typography variant="body1">
                        {item.product_name || 'Unknown Product'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ py: 2 }}>
                      <Typography variant="body1">
                        {item.quantity}
                      </Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ py: 2 }}>
                      <Typography variant="body1">
                        KES {formatCurrency(item.unit_price)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ py: 2 }}>
                      <Typography variant="body1" fontWeight="medium">
                        KES {formatCurrency(item.subtotal)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
                {safeInvoiceData.items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                      <Typography color="text.secondary">
                        No items found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Total Section - Matching the user's screenshot */}
          <Box display="flex" justifyContent="flex-end" mb={3}>
            <Box
              sx={{
                border: '1px solid',
                borderColor: 'grey.300',
                borderRadius: 1,
                p: 2,
                minWidth: 250,
                bgcolor: 'background.paper'
              }}
            >
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" fontWeight="bold">
                  Total:
                </Typography>
                <Typography variant="h5" fontWeight="bold" color="primary.main">
                  KES {formatCurrency(safeInvoiceData.total)}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Footer */}
          <Box mt={4} textAlign="center">
            <Typography variant="body2" color="text.secondary">
              Thank you for your business!
            </Typography>
            <Typography variant="caption" color="text.secondary" mt={1} display="block">
              This is a computer-generated invoice.
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} startIcon={<Close />}>
          Close
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Print />}
          onClick={() => handlePrint()}
        >
          Print Invoice
        </Button>
      </DialogActions>
    </Dialog>
  );
}