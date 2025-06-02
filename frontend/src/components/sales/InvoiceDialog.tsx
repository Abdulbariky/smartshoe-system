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

export default function InvoiceDialog({ open, onClose, invoiceData }: InvoiceDialogProps) {
  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Invoice-${invoiceData?.invoice_number || 'Document'}`,
  });

  if (!invoiceData) return null;

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
              <Typography>{invoiceData.customer_name || 'Walk-in Customer'}</Typography>
              <Chip
                label={invoiceData.sale_type}
                size="small"
                color={invoiceData.sale_type === 'retail' ? 'primary' : 'secondary'}
                sx={{ mt: 1 }}
              />
            </Box>
            <Box textAlign="right">
              <Typography variant="h6" gutterBottom>
                Invoice Details:
              </Typography>
              <Typography>Invoice #: {invoiceData.invoice_number}</Typography>
              <Typography>Date: {invoiceData.date}</Typography>
              <Typography>Payment: {invoiceData.payment_method}</Typography>
            </Box>
          </Box>

          {/* Items Table */}
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell>Item</TableCell>
                  <TableCell align="center">Quantity</TableCell>
                  <TableCell align="right">Unit Price</TableCell>
                  <TableCell align="right">Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoiceData.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.product_name}</TableCell>
                    <TableCell align="center">{item.quantity}</TableCell>
                    <TableCell align="right">KES {item.unit_price.toFixed(2)}</TableCell>
                    <TableCell align="right">KES {item.subtotal.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Totals - No Tax */}
          <Box mt={3} display="flex" justifyContent="flex-end">
            <Box width={250}>
              <Divider sx={{ my: 1 }} />
              <Box display="flex" justifyContent="space-between">
                <Typography variant="h6">Total:</Typography>
                <Typography variant="h6" fontWeight="bold">
                  KES {invoiceData.total.toFixed(2)}
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
      </DialogActions>
    </Dialog>
  );
}