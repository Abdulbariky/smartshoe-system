import { useState, useEffect } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Box,
  TextField,
  InputAdornment,
  TablePagination,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import {
  Visibility,
  Search,
  Print,
  Refresh,
  Close,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { salesService, type Sale } from '../../services/salesService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import InvoiceDialog from '../../components/sales/InvoiceDialog';

export default function SalesHistory() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<Date | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Sale details dialog
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  
  // Invoice dialog
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any>(null);

  const fetchSales = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('🔄 Loading sales history from API...');

      const response = await salesService.getSales();
      console.log('✅ Sales history loaded:', response);

      setSales(response.sales);
      setFilteredSales(response.sales);
    } catch (err: any) {
      console.error('❌ Failed to load sales history:', err);
      setError(err.message || 'Failed to load sales history');
      
      setSales([]);
      setFilteredSales([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  useEffect(() => {
    let filtered = sales;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(sale =>
        sale.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Date filter
    if (dateFilter) {
      filtered = filtered.filter(sale => {
        const saleDate = new Date(sale.created_at);
        return saleDate.toDateString() === dateFilter.toDateString();
      });
    }

    setFilteredSales(filtered);
    setPage(0);
  }, [searchTerm, dateFilter, sales]);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewDetails = (sale: Sale) => {
    setSelectedSale(sale);
    setDetailsDialogOpen(true);
  };

  const handlePrintInvoice = (sale: Sale) => {
    // Create invoice data for printing
    const invoice = {
      invoice_number: sale.invoice_number,
      date: new Date(sale.created_at).toLocaleString(),
      sale_type: sale.sale_type,
      items: [
        {
          product_name: `Sale Items (${sale.items_count} items)`,
          quantity: sale.items_count,
          unit_price: sale.total_amount / sale.items_count,
          subtotal: sale.total_amount,
        }
      ],
      total: sale.total_amount,
      payment_method: sale.payment_method,
    };
    
    setInvoiceData(invoice);
    setInvoiceDialogOpen(true);
  };

  const getPaymentMethodChip = (method: string) => {
    const config = {
      cash: { label: 'Cash', color: 'success' as const },
      card: { label: 'Card', color: 'primary' as const },
      credit: { label: 'Credit', color: 'warning' as const },
      bank_transfer: { label: 'Bank Transfer', color: 'info' as const },
    };

    const { label, color } = config[method as keyof typeof config] || { label: method, color: 'default' as const };
    return <Chip label={label} color={color} size="small" />;
  };

  const getSaleTypeChip = (type: 'retail' | 'wholesale') => {
    return (
      <Chip
        label={type}
        color={type === 'retail' ? 'default' : 'secondary'}
        size="small"
      />
    );
  };

  if (loading) return <LoadingSpinner message="Loading sales history..." />;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight="bold">
          Sales History ({filteredSales.length})
        </Typography>
        <IconButton onClick={fetchSales} disabled={loading}>
          <Refresh />
        </IconButton>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" gap={2} alignItems="center">
          <TextField
            placeholder="Search by invoice number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flex: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />

          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Filter by date"
              value={dateFilter}
              onChange={(newValue) => setDateFilter(newValue)}
              slotProps={{
                textField: {
                  sx: { width: 200 },
                },
              }}
            />
          </LocalizationProvider>
        </Box>
      </Paper>

      {/* Sales Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Invoice Number</TableCell>
              <TableCell>Date & Time</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Items</TableCell>
              <TableCell align="right">Total Amount</TableCell>
              <TableCell>Payment</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSales
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((sale) => (
                <TableRow key={sale.id} hover>
                  <TableCell>
                    <Typography fontWeight="medium">{sale.invoice_number}</Typography>
                  </TableCell>
                  <TableCell>
                    {new Date(sale.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {getSaleTypeChip(sale.sale_type)}
                  </TableCell>
                  <TableCell>{sale.items_count}</TableCell>
                  <TableCell align="right">
                    <Typography fontWeight="bold">
                      KES {sale.total_amount.toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {getPaymentMethodChip(sale.payment_method)}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="View Details">
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={() => handleViewDetails(sale)}
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Print Invoice">
                      <IconButton 
                        size="small" 
                        color="default"
                        onClick={() => handlePrintInvoice(sale)}
                      >
                        <Print />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            {filteredSales.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography color="text.secondary" sx={{ py: 3 }}>
                    {searchTerm || dateFilter 
                      ? 'No sales match your search criteria' 
                      : 'No sales found'
                    }
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredSales.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Sale Details Dialog */}
      <Dialog open={detailsDialogOpen} onClose={() => setDetailsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Sale Details - {selectedSale?.invoice_number}
        </DialogTitle>
        <DialogContent>
          {selectedSale && (
            <Box>
              <Typography variant="h6" gutterBottom>Sale Information</Typography>
              <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2} mb={3}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Invoice Number:</Typography>
                  <Typography fontWeight="bold">{selectedSale.invoice_number}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Date:</Typography>
                  <Typography>{new Date(selectedSale.created_at).toLocaleString()}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Sale Type:</Typography>
                  <Box mt={0.5}>
                    {getSaleTypeChip(selectedSale.sale_type)}
                  </Box>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Payment Method:</Typography>
                  <Box mt={0.5}>
                    {getPaymentMethodChip(selectedSale.payment_method)}
                  </Box>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Total Items:</Typography>
                  <Typography fontWeight="bold">{selectedSale.items_count}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Total Amount:</Typography>
                  <Typography fontWeight="bold" color="primary.main">
                    KES {selectedSale.total_amount.toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)} startIcon={<Close />}>
            Close
          </Button>
          <Button 
            variant="contained" 
            startIcon={<Print />}
            onClick={() => {
              setDetailsDialogOpen(false);
              if (selectedSale) handlePrintInvoice(selectedSale);
            }}
          >
            Print Invoice
          </Button>
        </DialogActions>
      </Dialog>

      {/* Invoice Dialog for Printing */}
      <InvoiceDialog
        open={invoiceDialogOpen}
        onClose={() => setInvoiceDialogOpen(false)}
        invoiceData={invoiceData}
      />
    </Box>
  );
}