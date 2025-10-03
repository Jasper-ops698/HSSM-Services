import React, { useEffect, useState, useCallback } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
// API_BASE_URL no longer required here; use centralized `api` client
import {
  CircularProgress,
  Button,
  Pagination,
  Typography,
  Box,
  Modal,
  Card,
  Grid,
  Table,            // Added for user table
  TableBody,        // Added for user table
  TableCell,        // Added for user table
  TableContainer,   // Added for user table
  TableHead,        // Added for user table
  TableRow,         // Added for user table
  Paper,            // Added for user table container
  Alert,            // Added for feedback messages
  Snackbar,         // Added for feedback messages
} from '@mui/material';
import { ArrowBack, ArrowForward, Refresh } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
} from 'chart.js';
import jsPDF from 'jspdf'; // Import jsPDF for PDF generation

ChartJS.register(Title, Tooltip, Legend, CategoryScale, LinearScale, BarElement, ArcElement);

// Styled components for better appearance
const StyledCard = styled(Card)(({ theme, $empty }) => ({
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[2],
  textAlign: 'center',
  padding: $empty ? theme.spacing(1) : theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  // minHeight removed to allow card to fit content
}));

const StyledButton = styled(Button)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  textTransform: 'none',
}));

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '80%',
  maxWidth: '600px', // Added maxWidth for better modal scaling
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
  maxHeight: '80%',
  overflowY: 'auto',
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]); // Will store detailed user list now
  const [requests, setRequests] = useState([]);
  const [services, setServices] = useState([]);
  const [hssmReports, setHssmReports] = useState([]);
  const [userRolesData, setUserRolesData] = useState({});
  const [requestStatusesData, setRequestStatusesData] = useState({});
  const [servicesCountData, setServicesCountData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalReports, setTotalReports] = useState(0);
  const [selectedReport, setSelectedReport] = useState(null); // State for selected report
  const [showReportModal, setShowReportModal] = useState(false); // State for report modal
  const [feedback, setFeedback] = useState({ open: false, message: '', severity: 'info' }); // For user action feedback

  const itemsPerPage = 5; // For HSSM reports pagination


  const getToken = () => localStorage.getItem('token');

  // Define fetchData using useCallback to prevent re-creation on every render
  const fetchData = useCallback(async () => {
    setIsLoading(true); // Start loading indicator
    setError(''); // Clear previous errors
    try {
      const token = getToken();
      if (!token) {
        setError('Unauthorized! Please log in.');
        setIsLoading(false);
        return;
      }

      // Fetch analytics data (assuming it includes the user list)
      const analyticsResponse = await api.get('/api/admin/analytics');
      const data = analyticsResponse.data;

      // Fetch paginated HSSM reports
      const reportsResponse = await api.get(`/api/admin/hssmProviderReports?page=${currentPage}&limit=${itemsPerPage}`);
      // Optionally, add a section for the current admin to manage their own 2FA
      // <TwoFactorSettings apiBaseUrl={API_BASE_URL} token={getToken()} />
      const normalizedReports = (reportsResponse.data.reports || []).map(r => ({
        ...r,
        id: r.id || r._id // Ensure every report has an 'id' field
      }));
      setUsers(data.users || []);
      setRequests(data.requests || []);
      setServices(data.services || []);
      setHssmReports(normalizedReports);
      setTotalReports(reportsResponse.data.totalReports || 0);

      // Process data for charts
      setUserRolesData({
        labels: Object.keys(data.userRoles || {}),
        datasets: [
          {
            data: Object.values(data.userRoles || {}),
            backgroundColor: ['#ff6384', '#36a2eb', '#ffce56', '#4bc0c0', '#9966ff'], // Example colors
            hoverOffset: 4
          },
        ],
      });

      setRequestStatusesData({
        labels: Object.keys(data.requestStatuses || {}),
        datasets: [
          {
            data: Object.values(data.requestStatuses || {}),
            backgroundColor: ['#ffcc00', '#36a2eb', '#ff8e72', '#66ff99'], // Example colors
            hoverOffset: 4
          },
        ],
      });

      setServicesCountData({
        labels: Object.keys(data.servicesCount || {}),
        datasets: [
          {
            label: 'Services Count',
            data: Object.values(data.servicesCount || {}),
            backgroundColor: Object.keys(data.servicesCount || {}).map(
              (_, index) => `hsl(${(index * 60) % 360}, 70%, 60%)` // Generate distinct colors
            ),
            borderColor: Object.keys(data.servicesCount || {}).map(
              (_, index) => `hsl(${(index * 60) % 360}, 70%, 40%)`
            ),
            borderWidth: 1,
          },
        ],
      });

    } catch (err) {
      console.error('Error fetching data:', err.response?.data?.message || err.message);
      setError(`Error fetching data: ${err.response?.data?.message || err.message}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]); // Depend on the memoized fetchData function

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  const handleViewReport = (report) => {
    setSelectedReport(report);
    setShowReportModal(true);
  };

  const handleDownloadReportPDF = (report) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('HSSM Report Details', 10, 10);
    doc.setFontSize(12);
    doc.text(`Provider Name: ${report.providerName || 'N/A'}`, 10, 20);
    doc.text(`Description: ${report.description || 'N/A'}`, 10, 30);
    doc.text(`Additional Details: ${report.details || 'No additional details provided.'}`, 10, 40);
    doc.text(`Reported At: ${new Date(report.createdAt).toLocaleString()}`, 10, 50);
    doc.save(`${report.providerName || 'Report'}_${report.id}.pdf`);
  };

  // --- User Management Functions ---

  const handleDisableUser = async (userId, isDisabled) => {
    // Add confirmation
    const action = isDisabled ? "enable" : "disable";
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) {
      return;
    }

    const token = getToken();
    if (!token) {
      setFeedback({ open: true, message: 'Authentication error.', severity: 'error' });
      return;
    }

      const endpoint = `/api/admin/users/${userId}/status`;
    const method = 'patch';
    const data = { isDisabled: !isDisabled }; // Toggle the state

    try {
        await api({ method, url: endpoint, data });
      setFeedback({ open: true, message: `User ${action}d successfully.`, severity: 'success' });
      // Update the user in the list immediately
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId || user._id === userId
            ? { ...user, isDisabled: !isDisabled }
            : user
        )
      );
    } catch (err) {
      console.error(`Error ${action}ing user:`, err.response?.data?.message || err.message);
      setFeedback({ open: true, message: `Failed to ${action} user: ${err.response?.data?.message || err.message}`, severity: 'error' });
    }
  };

  const handleDeleteUser = async (userId) => {
     // Add confirmation
    if (!window.confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) {
        return;
    }

    const token = getToken();
    if (!token) {
        setFeedback({ open: true, message: 'Authentication error.', severity: 'error' });
        return;
    }

  try {
    await api.delete(`/api/admin/users/${userId}`);
        setFeedback({ open: true, message: 'User deleted successfully.', severity: 'success' });
        // Refresh user data by removing the deleted user
        setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
         // Optionally, re-fetch analytics if deletion affects counts significantly
        // fetchData(); // Could cause a full refresh, filtering might be smoother
    } catch (err) {
        console.error('Error deleting user:', err.response?.data?.message || err.message);
        setFeedback({ open: true, message: `Failed to delete user: ${err.response?.data?.message || err.message}`, severity: 'error' });
    }
  };

  // --- End User Management Functions ---

  // --- HSSM Report Management ---
  const handleDeleteReport = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      return;
    }
    const token = getToken();
    if (!token) {
      setFeedback({ open: true, message: 'Authentication error.', severity: 'error' });
      return;
    }
    setIsLoading(true);
    try {
      await api.delete(`/api/admin/hssmProviderReports/${reportId}`);
      setFeedback({ open: true, message: 'Report deleted successfully.', severity: 'success' });
      setHssmReports((prev) => prev.filter((r) => (r.id || r._id) !== reportId));
      setTotalReports((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error deleting report:', err.response?.data?.message || err.message);
      setFeedback({ open: true, message: `Failed to delete report: ${err.response?.data?.message || err.message}`, severity: 'error' });
    } finally {
      setIsLoading(false);
    }
  };
  // --- End HSSM Report Management ---

  const handleCloseFeedback = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setFeedback({ ...feedback, open: false });
  };


  if (isLoading && users.length === 0) { // Show loading only on initial load or full refresh
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', p: 3 }}>
         <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button variant="contained" color="primary" onClick={fetchData}>
          Retry Fetching Data
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            variant="outlined" 
            startIcon={<ArrowBack />}
            onClick={() => navigate(-1)}
          >
            Back
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<ArrowForward />}
            onClick={() => navigate(1)}
          >
            Forward
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<Refresh />}
            onClick={() => {
              setIsLoading(true);
              fetchData();
            }}
            disabled={isLoading}
          >
            Refresh
          </Button>
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Admin Dashboard
        </Typography>
        <Box sx={{ width: 140 }} /> {/* Spacer for centering */}
      </Box>

      {/* Feedback Snackbar */}
      <Snackbar
        open={feedback.open}
        autoHideDuration={6000}
        onClose={handleCloseFeedback}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseFeedback} severity={feedback.severity} sx={{ width: '100%' }}>
          {feedback.message}
        </Alert>
      </Snackbar>

      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <StyledButton
          variant="contained"
          color="primary"
          onClick={() => window.location.href = '/admin-panel'}
        >
          Manage User Roles
        </StyledButton>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <StyledCard>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              Total Users
            </Typography>
            <Typography variant="h4" component="p">{users.length}</Typography>
          </StyledCard>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StyledCard>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              Total Requests
            </Typography>
             <Typography variant="h4" component="p">{requests.length}</Typography>
          </StyledCard>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StyledCard>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              Total Services
            </Typography>
             <Typography variant="h4" component="p">{services.length}</Typography>
          </StyledCard>
        </Grid>
      </Grid>

      {/* Analytics Charts */}
       <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2, fontWeight: 'medium' }}>
        Analytics Overview
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
         <Grid item xs={12} md={6} lg={4}>
           <StyledCard $empty={!(userRolesData.labels && userRolesData.labels.length > 0)}>
             <Typography variant="h6" gutterBottom>User Roles Distribution</Typography>
             {userRolesData.labels && userRolesData.labels.length > 0 ? (
               <Box sx={{ width: '100%', mt: 1 }}>
                 <Table size="small" aria-label="user roles table">
                   <TableHead>
                     <TableRow>
                       <TableCell sx={{ fontWeight: 'bold' }}>Role</TableCell>
                       <TableCell sx={{ fontWeight: 'bold' }}>Count</TableCell>
                     </TableRow>
                   </TableHead>
                   <TableBody>
                     {userRolesData.labels.map((label, idx) => (
                       <TableRow key={label}>
                         <TableCell>{label}</TableCell>
                         <TableCell>{userRolesData.datasets[0].data[idx]}</TableCell>
                       </TableRow>
                     ))}
                   </TableBody>
                 </Table>
               </Box>
             ) : (
               <Typography sx={{ p: 0.5 }}>No user role data available.</Typography>
             )}
           </StyledCard>
         </Grid>
         <Grid item xs={12} md={6} lg={4}>
           <StyledCard $empty={!(requestStatusesData.labels && requestStatusesData.labels.length > 0)}>
             <Typography variant="h6" gutterBottom>Request Statuses</Typography>
             {requestStatusesData.labels && requestStatusesData.labels.length > 0 ? (
               <Box sx={{ width: '100%', mt: 1 }}>
                 <Table size="small" aria-label="request statuses table">
                   <TableHead>
                     <TableRow>
                       <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                       <TableCell sx={{ fontWeight: 'bold' }}>Count</TableCell>
                     </TableRow>
                   </TableHead>
                   <TableBody>
                     {requestStatusesData.labels.map((label, idx) => (
                       <TableRow key={label}>
                         <TableCell>{label}</TableCell>
                         <TableCell>{requestStatusesData.datasets[0].data[idx]}</TableCell>
                       </TableRow>
                     ))}
                   </TableBody>
                 </Table>
               </Box>
             ) : (
               <Typography sx={{ p: 0.5 }}>No request status data available.</Typography>
             )}
           </StyledCard>
         </Grid>
         <Grid item xs={12} md={6} lg={4}>
           <StyledCard $empty={!(servicesCountData.labels && servicesCountData.labels.length > 0)}>
             <Typography variant="h6" gutterBottom>Services Count by Category</Typography>
              {servicesCountData.labels && servicesCountData.labels.length > 0 ? (
                <Box sx={{ width: '100%', mt: 1 }}>
                  <Table size="small" aria-label="services count table">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Category</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Count</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {servicesCountData.labels.map((label, idx) => (
                        <TableRow key={label}>
                          <TableCell>{label}</TableCell>
                          <TableCell>{servicesCountData.datasets[0].data[idx]}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              ) : (
                <Typography sx={{ p: 0.5 }}>No services count data available.</Typography>
              )}
           </StyledCard>
         </Grid>
      </Grid>

       {/* User Management Table */}
       <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2, fontWeight: 'medium' }}>
        User Management
      </Typography>
      {isLoading && users.length > 0 ? <CircularProgress sx={{ display: 'block', margin: 'auto' }} /> : null}
      {users.length === 0 && !isLoading ? (
         <Typography sx={{ textAlign: 'center', mt: 2 }}>No users found.</Typography>
      ) : (
        <Paper sx={{ width: '100%', overflow: 'hidden', mb: 4 }}>
          <TableContainer sx={{ maxHeight: 440 }}>
            <Table stickyHeader aria-label="user management table">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Username/Email</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Role</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>2FA</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow hover role="checkbox" tabIndex={-1} key={user.id || user._id}>
                    <TableCell>{user.username || user.email || 'N/A'}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>
                      <Typography variant='body2' color={user.isDisabled ? 'error.main' : 'success.main'}>
                        {user.isDisabled ? 'Disabled' : 'Active'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2' color={user.twoFactorEnabled ? 'success.main' : 'text.secondary'}>
                        {user.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        variant="outlined"
                        color={user.isDisabled ? "success" : "warning"}
                        size="small"
                        onClick={() => handleDisableUser(user.id || user._id, user.isDisabled)}
                        sx={{ mr: 1 }}
                      >
                        {user.isDisabled ? 'Enable' : 'Disable'}
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => handleDeleteUser(user.id || user._id)}
                        sx={{ mr: 1 }}
                      >
                        Delete
                      </Button>
                      {/* Admin 2FA controls for user (future: modal for enable/disable) */}
                      {/* <Button variant="outlined" size="small">Manage 2FA</Button> */}
                    </TableCell>
                  </TableRow>
))}
{/* Optionally, add a section for the current admin to manage their own 2FA */}
{/* <TwoFactorSettings apiBaseUrl={API_BASE_URL} token={getToken()} /> */}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}


      {/* HSSM Reports Section */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2, fontWeight: 'medium' }}>
        HSSM Provider Reports
      </Typography>
      {isLoading && hssmReports.length === 0 ? <CircularProgress sx={{ display: 'block', margin: 'auto' }} /> : null}
      {hssmReports.length === 0 && !isLoading ? (
        <Typography sx={{ textAlign: 'center', mt: 2 }}>No reports from HSSM providers found.</Typography>
      ) : (
        <Box>
          <Grid container spacing={3}>
            {hssmReports.map((report) => (
              <Grid item xs={12} md={6} lg={4} key={report.id || report._id}>
                <StyledCard>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" gutterBottom noWrap title={report.providerName}>
                      {report.providerName || 'Unknown Provider'}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {report.description ? (report.description.length > 100 ? report.description.substring(0, 97) + '...' : report.description) : 'No description.'}
                    </Typography>
                     <Typography variant="caption" display="block" color="textSecondary">
                        Reported: {new Date(report.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 2, width: '100%' }}>
                    <Button
                      variant="contained"
                      size="small"
                      color="secondary"
                      onClick={() => handleViewReport(report)}
                    >
                      View
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      color="success"
                      onClick={() => handleDownloadReportPDF(report)}
                    >
                      PDF
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      color="error"
                      onClick={() => handleDeleteReport(report.id || report._id)}
                    >
                      Delete
                    </Button>
                  </Box>
                </StyledCard>
              </Grid>
            ))}
          </Grid>
          {totalReports > itemsPerPage && (
            <Pagination
                count={Math.ceil(totalReports / itemsPerPage)}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}
            />
           )}
        </Box>
      )}

      {/* Report Details Modal */}
      <Modal open={showReportModal} onClose={() => setShowReportModal(false)}>
        <Box sx={modalStyle}>
          <Typography variant="h5" gutterBottom sx={{ textAlign: 'center', fontWeight: 'bold', mb: 2 }}>
            Report Details
          </Typography>
          {selectedReport && (
            <Box>
              <Typography variant="h6">Provider Name:</Typography>
              <Typography gutterBottom>{selectedReport.providerName || 'N/A'}</Typography>
              <Typography variant="h6" sx={{ mt: 2 }}>
                Description:
              </Typography>
              <Typography gutterBottom>{selectedReport.description || 'N/A'}</Typography>
              <Typography variant="h6" sx={{ mt: 2 }}>
                Additional Details:
              </Typography>
              <Typography gutterBottom>{selectedReport.details || 'No additional details provided.'}</Typography>
               <Typography variant="h6" sx={{ mt: 2 }}>
                Reported At:
              </Typography>
              <Typography>{new Date(selectedReport.createdAt).toLocaleString()}</Typography>
            </Box>
          )}
          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Button
              variant="outlined" // Changed for contrast
              color="primary"
              onClick={() => setShowReportModal(false)}
              sx={{ mr: 2 }}
            >
              Close
            </Button>
            {selectedReport && (
              <Button
                variant="contained"
                color="success"
                onClick={() => handleDownloadReportPDF(selectedReport)}
              >
                Download PDF
              </Button>
            )}
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default AdminDashboard;