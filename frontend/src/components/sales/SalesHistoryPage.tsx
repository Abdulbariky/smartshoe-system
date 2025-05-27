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
} from '@mui/material';
import {
  Visibility,
  Search,
  Print,
  Refresh,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { salesService, type Sale } from '../../services/salesService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function SalesHistory() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<Date | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const fetchSales = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('🔄 Loading sales history from API...');

      // ✅ Real API call instead of mock data
      const response = await salesService.getSales();
      console.log('✅ Sales history loaded:', response);

      setSales(response.sales);
      setFilteredSales(response.sales);
    } catch (err: any) {
      console.error('❌ Failed to load sales history:', err);
      setError(err.message || 'Failed to load sales history');
      
      // Clear sales on error
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
                        onClick={() => {
                          // TODO: Implement view details functionality
                          console.log('View sale details:', sale.id);
                        }}
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Print Invoice">
                      <IconButton 
                        size="small" 
                        color="default"
                        onClick={() => {
                          // TODO: Implement print functionality
                          console.log('Print invoice:', sale.invoice_number);
                        }}
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
    </Box>
  );
}