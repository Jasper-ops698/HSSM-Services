import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Avatar,
  IconButton,
  Tooltip,
  InputAdornment
} from '@mui/material';
import {
  Add,
  Remove,
  History,
  Person,
  TrendingUp,
  TrendingDown,
  AccountBalanceWallet,
  Search
} from '@mui/icons-material';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const CreditManager = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [students, setStudents] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openCreditDialog, setOpenCreditDialog] = useState(false);
  const [openHistoryDialog, setOpenHistoryDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [creditAction, setCreditAction] = useState({
    type: 'add',
    amount: '',
    reason: ''
  });

  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get('/api/credits/dashboard');
      setDashboardData(response.data);
      setStudents(response.data.students);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to fetch dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch transaction history
  const fetchTransactionHistory = useCallback(async (studentId = null) => {
    try {
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        ...(studentId && { userId: studentId })
      };

      const response = await api.get('/api/credits/transactions', { params });
      setTransactions(response.data.transactions);
    } catch (err) {
      console.error('Error fetching transaction history:', err);
    }
  }, [page, rowsPerPage]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, fetchDashboardData]);

  // Auto-refresh data every 3 minutes to reduce server load
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      fetchDashboardData();
    }, 3 * 60 * 1000); // 3 minutes

    return () => clearInterval(interval);
  }, [user, fetchDashboardData]);

  useEffect(() => {
    if (openHistoryDialog) {
      fetchTransactionHistory(selectedStudent?._id);
    }
  }, [openHistoryDialog, selectedStudent, fetchTransactionHistory]);

  // Handle credit action (add/deduct)
  const handleCreditAction = async () => {
    if (!selectedStudent || !creditAction.amount || !creditAction.reason) return;

    try {
      setIsSubmitting(true);

      const endpoint = creditAction.type === 'add' ? '/api/credits/add' : '/api/credits/deduct';
      const payload = {
        userId: selectedStudent._id,
        amount: parseFloat(creditAction.amount),
        reason: creditAction.reason
      };

      await api.post(endpoint, payload);

      // Refresh dashboard data
      await fetchDashboardData();

      // Close dialog and reset
      setOpenCreditDialog(false);
      setSelectedStudent(null);
      setCreditAction({ type: 'add', amount: '', reason: '' });

      alert(`Credits ${creditAction.type === 'add' ? 'added' : 'deducted'} successfully!`);
    } catch (err) {
      console.error('Error performing credit action:', err);
      alert(`Failed to ${creditAction.type} credits. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open credit action dialog
  const openCreditActionDialog = (student, type) => {
    setSelectedStudent(student);
    setCreditAction({ type, amount: '', reason: '' });
    setOpenCreditDialog(true);
  };

  // Open transaction history dialog
  const openTransactionHistoryDialog = (student) => {
    setSelectedStudent(student);
    setOpenHistoryDialog(true);
  };

  // Filter students based on search term
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Credit Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage student credits and view transaction history
        </Typography>
      </Box>

      {/* Summary Cards */}
      {dashboardData && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  <Person sx={{ mr: 1, color: 'primary.main' }} /> Total Students
                </Typography>
                <Typography variant="h4">{dashboardData.students.length}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  <AccountBalanceWallet sx={{ mr: 1, color: 'success.main' }} /> Total Credits
                </Typography>
                <Typography variant="h4">{dashboardData.totalCreditsRemitted}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  <History sx={{ mr: 1, color: 'info.main' }} /> Actions Today
                </Typography>
                <Typography variant="h4">{dashboardData.actionsToday}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Search and Students Table */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Student Credit Balances</Typography>
          <TextField
            size="small"
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Student</TableCell>
                <TableCell>Email</TableCell>
                <TableCell align="right">Credits</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredStudents
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((student) => (
                  <TableRow key={student._id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                          {student.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography variant="body1">{student.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell align="right">
                      <Chip
                        label={`${student.credits || 0} credits`}
                        color={(student.credits || 0) > 0 ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Add Credits">
                        <IconButton
                          color="success"
                          onClick={() => openCreditActionDialog(student, 'add')}
                        >
                          <Add />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Deduct Credits">
                        <IconButton
                          color="error"
                          onClick={() => openCreditActionDialog(student, 'deduct')}
                        >
                          <Remove />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Transaction History">
                        <IconButton
                          color="info"
                          onClick={() => openTransactionHistoryDialog(student)}
                        >
                          <History />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={filteredStudents.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Credit Action Dialog */}
      <Dialog
        open={openCreditDialog}
        onClose={() => setOpenCreditDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {creditAction.type === 'add' ? 'Add Credits' : 'Deduct Credits'}
        </DialogTitle>
        <DialogContent>
          {selectedStudent && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="subtitle1" gutterBottom>
                Student: {selectedStudent.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Current Balance: {selectedStudent.credits || 0} credits
              </Typography>

              <TextField
                fullWidth
                type="number"
                label="Amount"
                value={creditAction.amount}
                onChange={(e) => setCreditAction(prev => ({ ...prev, amount: e.target.value }))}
                sx={{ mt: 2 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">💰</InputAdornment>,
                }}
              />

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Reason"
                value={creditAction.reason}
                onChange={(e) => setCreditAction(prev => ({ ...prev, reason: e.target.value }))}
                sx={{ mt: 2 }}
                placeholder={`Enter reason for ${creditAction.type === 'add' ? 'adding' : 'deducting'} credits...`}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreditDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreditAction}
            variant="contained"
            disabled={!creditAction.amount || !creditAction.reason || isSubmitting}
            color={creditAction.type === 'add' ? 'success' : 'error'}
            startIcon={creditAction.type === 'add' ? <TrendingUp /> : <TrendingDown />}
          >
            {isSubmitting ? <CircularProgress size={20} /> : `${creditAction.type === 'add' ? 'Add' : 'Deduct'} Credits`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Transaction History Dialog */}
      <Dialog
        open={openHistoryDialog}
        onClose={() => setOpenHistoryDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Transaction History {selectedStudent && `- ${selectedStudent.name}`}
        </DialogTitle>
        <DialogContent>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Performed By</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction._id}>
                    <TableCell>
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={transaction.action}
                        color={transaction.action === 'add' ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">{transaction.amount}</TableCell>
                    <TableCell>{transaction.reason}</TableCell>
                    <TableCell>{transaction.performedBy?.name || 'System'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenHistoryDialog(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CreditManager;