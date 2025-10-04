import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Container, Typography, Grid, Card, CardContent, Button, Select, MenuItem, FormControl, InputLabel, Snackbar, Alert, TextField, Box, Chip
} from '@mui/material';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import VenueManager from '../components/VenueManager';
import AnnouncementManager from '../components/AnnouncementManager';
const LOGO_COLOR = '#1976d2'; // Replace with your actual logo color

const roleOptions = [
  { value: 'student', label: 'Student' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'credit-controller', label: 'Credit Controller' },
  { value: 'HOD', label: 'Head of Department' },
  { value: 'HSSM-provider', label: 'HSSM Provider' },
  { value: 'admin', label: 'Admin' }
];

const departmentOptions = [
  'Health Systems Support Management',
  'Medical Catering',
  'Medical Engineering',
  'Health Systems Support',
  'Clinical Medicine & Surgery',
  'Community Health Nursing',
  'Orthopaedic & Trauma Medicine',
  'Community Health and Development',
  'Community Health Assistant',
  'ICPP',
  'Peri-Operative Procedures',
  'Dental Technology',
  'Common Unit',
  'Medical Laboratory Technology',
  'Nursing',
  'Pharmacy',
  'Clinical Medicine',
  'Nutrition & Dietetics'
];

// Main AdminPanel component

const AdminPanel = () => {
  // --- Department Report Download State ---
  const [reportDepartment, setReportDepartment] = useState('');
  const [reportPeriod, setReportPeriod] = useState('week');
  const [reportStart, setReportStart] = useState('');
  const [reportLoading, setReportLoading] = useState(false);

  // Download department report as CSV
  const handleDownloadReport = async () => {
    if (!reportDepartment || !reportPeriod || !reportStart) {
      setFeedback({ open: true, message: 'Please select department, period, and start date.', severity: 'warning' });
      return;
    }
    setReportLoading(true);
    try {
      const params = new URLSearchParams({
        department: reportDepartment,
        period: reportPeriod,
        start: reportStart
      });
      const res = await api.get(`/api/admin/department-report-csv?${params.toString()}`, {
        responseType: 'blob',
      });
      // Download the CSV file
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportDepartment}_activity_report_${reportPeriod}_${reportStart}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      setFeedback({ open: true, message: 'Failed to download report.', severity: 'error' });
    } finally {
      setReportLoading(false);
    }
  };
  const { refreshUser } = useAuth();
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [feedback, setFeedback] = useState({ open: false, message: '', severity: 'info' });
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAllUsers();
  }, []);

  const fetchAllUsers = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/api/admin/analytics');
      setAllUsers(res.data.users || []);
    } catch (err) {
      setFeedback({ open: true, message: 'Failed to fetch users.', severity: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = allUsers.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRole) {
      setFeedback({ open: true, message: 'Please select both a user and a role.', severity: 'warning' });
      return;
    }

    // Check if department is required
    if ((selectedRole === 'teacher' || selectedRole === 'HOD') && !selectedDepartment) {
      setFeedback({ open: true, message: 'Department is required for Teacher and HOD roles.', severity: 'warning' });
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        userId: selectedUser,
        role: selectedRole
      };

      if (selectedDepartment) {
        payload.department = selectedDepartment;
      }

      await api.post('/api/admin/assignRole', payload);

      setFeedback({ open: true, message: 'Role assigned successfully!', severity: 'success' });
      fetchAllUsers(); // Refetch users after role assignment
      
      // Refresh current user data in case admin assigned role to themselves
      await refreshUser();

      // Reset form
      setSelectedUser('');
      setSelectedRole('');
      setSelectedDepartment('');
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to assign role.';
      setFeedback({ open: true, message: errorMessage, severity: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: 'error',
      teacher: 'primary',
      'credit-controller': 'secondary',
      HOD: 'warning',
      'HSSM-provider': 'info',
      student: 'success'
    };
    return colors[role] || 'default';
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>

      {/* Department Activity Report Download */}
      <Card sx={{ mb: 4, borderColor: LOGO_COLOR, borderWidth: 2, borderStyle: 'solid' }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3, color: LOGO_COLOR, fontWeight: 'bold' }}>
            Download Department Activity Report (CSV)
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel id="report-dept-label">Department</InputLabel>
                <Select
                  labelId="report-dept-label"
                  value={reportDepartment}
                  label="Department"
                  onChange={e => setReportDepartment(e.target.value)}
                >
                  <MenuItem value=""><em>Select department...</em></MenuItem>
                  {departmentOptions.map(dept => (
                    <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel id="report-period-label">Period</InputLabel>
                <Select
                  labelId="report-period-label"
                  value={reportPeriod}
                  label="Period"
                  onChange={e => setReportPeriod(e.target.value)}
                >
                  <MenuItem value="week">Weekly</MenuItem>
                  <MenuItem value="month">Monthly</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="Start Date"
                type="date"
                value={reportStart}
                onChange={e => setReportStart(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleDownloadReport}
                disabled={reportLoading}
                sx={{ height: '56px', fontWeight: 'bold' }}
                fullWidth
              >
                {reportLoading ? 'Downloading...' : 'Download CSV'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      <Typography variant="h4" align="center" gutterBottom sx={{ color: LOGO_COLOR, fontWeight: 'bold', mb: 4 }}>
        Admin Panel: User Role Management
      </Typography>

      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Button
          variant="outlined"
          color="primary"
          onClick={() => window.location.href = '/admin'}
          sx={{ mr: 2 }}
        >
          Back to Admin Dashboard
        </Button>
      </Box>

      {/* Venue Management Card */}
      <Box sx={{ mb: 4 }}>
        <VenueManager />
      </Box>

      {/* Announcement Management */}
      <Box sx={{ mb: 4 }}>
        <AnnouncementManager />
      </Box>

      {/* Role Assignment Card */}
      <Card sx={{ mb: 4, borderColor: LOGO_COLOR, borderWidth: 2, borderStyle: 'solid' }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3, color: LOGO_COLOR, fontWeight: 'bold' }}>
            Assign Roles to Users
          </Typography>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Search Users"
                variant="outlined"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or email..."
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel id="user-select-label">Select User</InputLabel>
                <Select
                  labelId="user-select-label"
                  value={selectedUser}
                  label="Select User"
                  onChange={e => setSelectedUser(e.target.value)}
                  sx={{ bgcolor: '#f5f5f5' }}
                >
                  <MenuItem value=""><em>Choose a user...</em></MenuItem>
                  {filteredUsers.map(user => (
                    <MenuItem key={user._id} value={user._id}>
                      <Box>
                        <Typography variant="body1">{user.name}</Typography>
                        <Typography variant="caption" color="textSecondary">{user.email}</Typography>
                        {user.role && (
                          <Chip
                            label={user.role}
                            size="small"
                            color={getRoleColor(user.role)}
                            sx={{ ml: 1, fontSize: '0.7rem' }}
                          />
                        )}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel id="role-select-label">Role</InputLabel>
                <Select
                  labelId="role-select-label"
                  value={selectedRole}
                  label="Role"
                  onChange={e => setSelectedRole(e.target.value)}
                  sx={{ bgcolor: '#f5f5f5' }}
                >
                  <MenuItem value=""><em>Select role...</em></MenuItem>
                  {roleOptions.map(role => (
                    <MenuItem key={role.value} value={role.value}>{role.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {(selectedRole === 'teacher' || selectedRole === 'HOD') && (
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel id="department-select-label">Department</InputLabel>
                  <Select
                    labelId="department-select-label"
                    value={selectedDepartment}
                    label="Department"
                    onChange={e => setSelectedDepartment(e.target.value)}
                    sx={{ bgcolor: '#f5f5f5' }}
                  >
                    <MenuItem value=""><em>Select department...</em></MenuItem>
                    {departmentOptions.map(dept => (
                      <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
            <Grid item xs={12} md={2}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleAssignRole}
                disabled={isLoading || !selectedUser || !selectedRole}
                sx={{ mt: 1, bgcolor: LOGO_COLOR, height: '56px', fontWeight: 'bold' }}
                fullWidth
              >
                {isLoading ? 'Assigning...' : 'Assign Role'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Users Overview Card */}
      <Card sx={{ borderColor: LOGO_COLOR, borderWidth: 1, borderStyle: 'solid' }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, color: LOGO_COLOR, fontWeight: 'bold' }}>
            Users Overview ({allUsers.length} total users)
          </Typography>
          <Grid container spacing={2}>
            {allUsers.slice(0, 12).map(user => (
              <Grid item xs={12} sm={6} md={4} key={user._id}>
                <Box sx={{
                  p: 2,
                  border: '1px solid #e0e0e0',
                  borderRadius: 2,
                  bgcolor: '#fafafa'
                }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    {user.name}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {user.email}
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    {user.role ? (
                      <Chip
                        label={user.role}
                        size="small"
                        color={getRoleColor(user.role)}
                        variant="outlined"
                      />
                    ) : (
                      <Chip
                        label="No Role"
                        size="small"
                        color="default"
                        variant="outlined"
                      />
                    )}
                    {user.department && (
                      <Chip
                        label={user.department}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ ml: 1 }}
                      />
                    )}
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
          {allUsers.length > 12 && (
            <Typography variant="body2" color="textSecondary" sx={{ mt: 2, textAlign: 'center' }}>
              Showing first 12 users. Use search to find specific users.
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Class Management Card */}
      <Grid container spacing={4} sx={{ mt: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Class Control
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                View, edit, or delete all classes in the system.
              </Typography>
              <Button
                variant="contained"
                component={Link}
                to="/manage-classes"
                fullWidth
              >
                Manage Classes
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar
        open={feedback.open}
        autoHideDuration={6000}
        onClose={() => setFeedback({ ...feedback, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setFeedback({ ...feedback, open: false })} severity={feedback.severity} variant="filled">
          {feedback.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminPanel;
