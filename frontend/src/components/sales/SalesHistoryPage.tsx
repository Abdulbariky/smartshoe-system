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
  CircularProgress,
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
import { salesService, type Sale, type DetailedSale } from '../../services/salesService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import InvoiceDialog from '../../components/sales/InvoiceDialog';

// ✅ FIXED: Helper function to safely format currency
const formatCurrency = (value: number | undefined | null): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0.00';
  }
  return Number(value).toFixed(2);
};

// ✅ FIXED: Helper function to properly format date and time for Kenya
const formatDateTime = (dateString: string | undefined | null): string => {
  if (!dateString) return 'Invalid Date';

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';

    // Format for Kenya locale with proper time
    return date.toLocaleString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Africa/Nairobi'
    });
  } catch (error) {
    return 'Invalid Date';
  }
};

// ✅ FIXED: Helper function to format date only
const formatDate = (dateString: string | undefined | null): string => {
  if (!dateString) return 'Invalid Date';

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';

    return date.toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'Africa/Nairobi'
    });
  } catch (error) {
    return 'Invalid Date';
  }
};

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
  const [selectedSale, setSelectedSale] = useState<DetailedSale | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

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
        sale.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Date filter
    if (dateFilter) {
      filtered = filtered.filter(sale => {
        if (!sale.created_at) return false;
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

  const fetchSaleDetails = async (saleId: number): Promise<DetailedSale | null> => {
    try {
      setLoadingDetails(true);
      console.log(`🔄 Fetching details for sale ID: ${saleId}`);

      const detailedSale = await salesService.getSaleWithDetails(saleId);
      console.log('✅ Sale details loaded:', detailedSale);

      // ✅ FIXED: Comprehensive validation and sanitization WITHOUT fake customer names
      if (detailedSale) {
        const sanitizedSale: DetailedSale = {
          ...detailedSale,
          id: detailedSale.id || saleId,
          invoice_number: detailedSale.invoice_number || `INV-${saleId}`,
          sale_type: detailedSale.sale_type || 'retail',
          total_amount: Number(detailedSale.total_amount) || 0,
          payment_method: detailedSale.payment_method || 'cash',
          created_at: detailedSale.created_at || new Date().toISOString(),
          items_count: Number(detailedSale.items_count) || 0,
          // ❌ REMOVED: No fake customer names - use actual data or leave empty
          customer_name: detailedSale.customer_name || undefined,
          items: (detailedSale.items || []).map(item => ({
            ...item,
            id: item.id || Math.random(),
            product_id: item.product_id || 0,
            product_name: item.product_name || 'Unknown Product',
            product_brand: item.product_brand || 'Unknown Brand',
            product_size: item.product_size || 'N/A',
            product_color: item.product_color || 'N/A',
            quantity: Number(item.quantity) || 0,
            unit_price: Number(item.unit_price) || 0,
            subtotal: Number(item.subtotal) || 0,
          })),
        };

        console.log('🧹 Sanitized sale details (no fake names):', sanitizedSale);
        return sanitizedSale;
      }

      return null;
    } catch (err: any) {
      console.error('❌ Failed to load sale details:', err);
      setError(`Failed to load sale details: ${err.message}`);
      return null;
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleViewDetails = async (sale: Sale) => {
    console.log('👀 Viewing details for sale:', sale);
    const detailedSale = await fetchSaleDetails(sale.id);
    if (detailedSale) {
      setSelectedSale(detailedSale);
      setDetailsDialogOpen(true);
    }
  };

  const handlePrintInvoice = async (sale: Sale) => {
    console.log('🖨️ Preparing invoice for sale:', sale);
    const detailedSale = await fetchSaleDetails(sale.id);
    if (detailedSale) {
      const invoice = {
        invoice_number: detailedSale.invoice_number || `INV-${sale.id}`,
        date: formatDateTime(detailedSale.created_at),
        // ✅ FIXED: NEVER generate fake names - only use real data or default
        customer_name: 'Walk-in Customer', // Always use this default
        sale_type: detailedSale.sale_type || 'retail',
        items: (detailedSale.items || []).map(item => ({
          product_name: `${item.product_name} - ${item.product_brand} (${item.product_size}, ${item.product_color})`,
          quantity: Number(item.quantity) || 0,
          unit_price: Number(item.unit_price) || 0,
          subtotal: Number(item.subtotal) || 0,
        })),
        total: Number(detailedSale.total_amount) || 0,
        payment_method: detailedSale.payment_method || 'Cash',
      };

      setInvoiceData(invoice);
      setInvoiceDialogOpen(true);
    }
  };

  const getPaymentMethodChip = (method: string) => {
    const config = {
      cash: { label: 'Cash', color: 'success' as const },
      card: { label: 'Card', color: 'primary' as const },
      credit: { label: 'Credit', color: 'warning' as const },
      bank_transfer: { label: 'Bank Transfer', color: 'info' as const },
    };

    const { label, color } = config[method as keyof typeof config] || { label: method || 'Unknown', color: 'default' as const };
    return <Chip label={label} color={color} size="small" />;
  };

  const getSaleTypeChip = (type: 'retail' | 'wholesale') => {
    return (
      <Chip
        label={type || 'retail'}
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

      {/* Loading indicator for fetching details */}
      {loadingDetails && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <CircularProgress size={16} />
            Loading sale details...
          </Box>
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
                    <Typography fontWeight="medium">{sale.invoice_number || `INV-${sale.id}`}</Typography>
                  </TableCell>
                  <TableCell>
                    {/* ✅ FIXED: Show correct formatted date and time */}
                    {formatDateTime(sale.created_at)}
                  </TableCell>
                  <TableCell>
                    {getSaleTypeChip(sale.sale_type)}
                  </TableCell>
                  <TableCell>{sale.items_count || 0}</TableCell>
                  <TableCell align="right">
                    <Typography fontWeight="bold">
                      KES {formatCurrency(sale.total_amount)}
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
                        disabled={loadingDetails}
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Print Invoice">
                      <IconButton
                        size="small"
                        color="default"
                        onClick={() => handlePrintInvoice(sale)}
                        disabled={loadingDetails}
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
          Sale Details - {selectedSale?.invoice_number || 'Unknown Invoice'}
        </DialogTitle>
        <DialogContent>
          {selectedSale && (
            <Box>
              <Typography variant="h6" gutterBottom>Sale Information</Typography>
              <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2} mb={3}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Invoice Number:</Typography>
                  <Typography fontWeight="bold">{selectedSale.invoice_number || 'N/A'}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Date & Time:</Typography>
                  <Typography>{formatDateTime(selectedSale.created_at)}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Customer:</Typography>
                  {/* ✅ FIXED: Always show "Walk-in Customer" - no fake names */}
                  <Typography>Walk-in Customer</Typography>
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
                  <Typography variant="body2" color="text.secondary">Total Amount:</Typography>
                  <Typography fontWeight="bold" color="primary.main">
                    KES {formatCurrency(selectedSale.total_amount)}
                  </Typography>
                </Box>
              </Box>

              {/* Detailed Items Table */}
              <Typography variant="h6" gutterBottom>Items Sold</Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.100' }}>
                      <TableCell>Item</TableCell>
                      <TableCell align="center">Quantity</TableCell>
                      <TableCell align="right">Unit Price</TableCell>
                      <TableCell align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(selectedSale.items || []).map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {item.product_name || 'Unknown Product'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.product_brand || 'Unknown'} | Size: {item.product_size || 'N/A'} | {item.product_color || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">{item.quantity || 0}</TableCell>
                        <TableCell align="right">KES {formatCurrency(item.unit_price)}</TableCell>
                        <TableCell align="right">
                          <Typography fontWeight="bold">
                            KES {formatCurrency(item.subtotal)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!selectedSale.items || selectedSale.items.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          <Typography color="text.secondary" sx={{ py: 2 }}>
                            No items found for this sale
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
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
              if (selectedSale) handlePrintInvoice({ ...selectedSale });
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