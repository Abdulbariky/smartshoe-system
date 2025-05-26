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
} from '@mui/material';
import {
  Visibility,
  Search,
  Print,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

interface Sale {
  id: number;
  invoice_number: string;
  sale_type: 'retail' | 'wholesale';
  total_amount: number;
  payment_method: string;
  created_at: string;
  items_count: number;
  customer_name?: string;
}

export default function SalesHistory() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<Date | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    // Mock sales data
    const mockSales: Sale[] = [
      {
        id: 1,
        invoice_number: 'INV-20240120-001',
        sale_type: 'retail',
        total_amount: 280,
        payment_method: 'cash',
        created_at: '2024-01-20T10:30:00',
        items_count: 2,
        customer_name: 'Walk-in Customer',
      },
      {
        id: 2,
        invoice_number: 'INV-20240120-002',
        sale_type: 'wholesale',
        total_amount: 1200,
        payment_method: 'credit',
        created_at: '2024-01-20T14:15:00',
        items_count: 10,
        customer_name: 'ABC Retailers',
      },
      {
        id: 3,
        invoice_number: 'INV-20240119-003',
        sale_type: 'retail',
        total_amount: 140,
        payment_method: 'card',
        created_at: '2024-01-19T16:45:00',
        items_count: 1,
      },
      {
        id: 4,
        invoice_number: 'INV-20240119-004',
        sale_type: 'wholesale',
        total_amount: 3500,
        payment_method: 'bank_transfer',
        created_at: '2024-01-19T11:20:00',
        items_count: 25,
        customer_name: 'XYZ Distributors',
      },
    ];

    setSales(mockSales);
    setFilteredSales(mockSales);
  }, []);

  useEffect(() => {
    let filtered = sales;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(sale =>
        sale.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
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

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Sales History
      </Typography>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" gap={2} alignItems="center">
          <TextField
            placeholder="Search by invoice or customer..."
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
              <TableCell>Customer</TableCell>
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
                  <TableCell>{sale.customer_name || 'Walk-in'}</TableCell>
                  <TableCell>
                    <Chip
                      label={sale.sale_type}
                      color={sale.sale_type === 'retail' ? 'default' : 'secondary'}
                      size="small"
                    />
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
                      <IconButton size="small" color="primary">
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Print Invoice">
                      <IconButton size="small" color="default">
                        <Print />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
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