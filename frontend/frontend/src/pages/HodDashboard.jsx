import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button
} from '@mui/material';
import { People, Class, HourglassEmpty, Refresh, ArrowBack, ArrowForward } from '@mui/icons-material';
import axios from 'axios';
import { rateLimitedRequest } from '../utils/rateLimitedRequest';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import TimetableUpload from '../components/TimetableUpload';
import AbsenceManager from '../components/AbsenceManager';
import AnnouncementForm from '../components/AnnouncementForm'; // Import the new component
import AnnouncementManager from '../components/AnnouncementManager';

import { API_BASE_URL } from '../config';

const HodDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  // Session timeout: log out after 15 minutes
  useEffect(() => {
    let sessionTimeout;
    sessionTimeout = setTimeout(() => {
      if (logout) logout();
      alert('Your session has expired. Please log in again.');
      navigate('/login');
    }, 15 * 60 * 1000);
    return () => {
      clearTimeout(sessionTimeout);
    };
  }, [logout, navigate]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [availableStudents, setAvailableStudents] = useState([]);
  const [enrollingStudentId, setEnrollingStudentId] = useState(null);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await rateLimitedRequest({
          url: `${API_BASE_URL}/api/hod/dashboard`,
          method: 'get',
          headers: { Authorization: `Bearer ${token}` },
        });
        setDashboardData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'An error occurred while fetching data.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  // Auto-refresh data every 5 minutes to keep credit data updated
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      const fetchDashboardData = async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await axios.get(`${API_BASE_URL}/api/hod/dashboard`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setDashboardData(res.data);
        } catch (err) {
          console.error('Failed to refresh HOD dashboard data:', err);
        }
      };
      fetchDashboardData();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [user]);

  // Fetch available students for enrollment
  const fetchAvailableStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await rateLimitedRequest({
        url: `${API_BASE_URL}/api/hod/available-students`,
        method: 'get',
        headers: { Authorization: `Bearer ${token}` },
      });
      setAvailableStudents(res.data.students);
    } catch (err) {
      console.error('Failed to fetch available students:', err);
    }
  };

  // Enroll student in department
  const enrollStudent = async (studentId) => {
    try {
      setEnrollingStudentId(studentId);
      const token = localStorage.getItem('token');
      const res = await rateLimitedRequest({
        url: `${API_BASE_URL}/api/hod/enroll-student`,
        method: 'post',
        headers: { Authorization: `Bearer ${token}` },
        data: { studentId },
      });
      alert(res.data.message);
      // Refresh available students list
      fetchAvailableStudents();
      // Refresh dashboard data
      const dashboardRes = await rateLimitedRequest({
        url: `${API_BASE_URL}/api/hod/dashboard`,
        method: 'get',
        headers: { Authorization: `Bearer ${token}` },
      });
      setDashboardData(dashboardRes.data);
    } catch (err) {
      console.error('Failed to enroll student:', err);
      alert(err.response?.data?.message || 'Failed to enroll student');
    } finally {
      setEnrollingStudentId(null);
    }
  };

  const handleAnnouncementCreated = () => {
    setShowAnnouncementForm(false);
    // Optionally, refresh dashboard data or show a success message
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'Approved':
        return <Chip label="Approved" color="success" size="small" />;
      case 'Pending':
        return <Chip label="Pending" color="warning" size="small" />;
      case 'Rejected':
        return <Chip label="Rejected" color="error" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box sx={{ p: 3, flexGrow: 1 }}>
      {/* Header with Refresh Button */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" gutterBottom>
          HOD Dashboard ({user?.department})
        </Typography>
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
              setLoading(true);
              const fetchData = async () => {
                try {
                  const token = localStorage.getItem('token');
                  const res = await rateLimitedRequest({
                    url: `${API_BASE_URL}/api/hod/dashboard`,
                    method: 'get',
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  setDashboardData(res.data);
                  await fetchAvailableStudents();
                } catch (err) {
                  setError(err.response?.data?.message || 'An error occurred while fetching data.');
                } finally {
                  setLoading(false);
                }
              };
              fetchData();
            }}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* KPI Cards */}
        <Grid item xs={12}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}><People sx={{ mr: 1 }} /> Teachers</Typography>
                  <Typography variant="h4">{dashboardData?.kpi?.totalTeachers ?? '0'}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}><Class sx={{ mr: 1 }} /> Classes</Typography>
                  <Typography variant="h4">{dashboardData?.kpi?.totalClasses ?? '0'}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}><People sx={{ mr: 1 }} /> Students</Typography>
                  <Typography variant="h4">{dashboardData?.kpi?.totalStudents ?? '0'}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}><HourglassEmpty sx={{ mr: 1 }} /> Pending</Typography>
                  <Typography variant="h4">{dashboardData?.kpi?.pendingEnrollments ?? '0'}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* HOD Announcement Management */}
        <Grid item xs={12}>
          <AnnouncementManager />
        </Grid>

        {/* Announcement Form Modal */}
        <AnnouncementForm
          open={showAnnouncementForm}
          onClose={() => setShowAnnouncementForm(false)}
          onAnnouncementCreated={handleAnnouncementCreated}
        />

        {/* Department Teachers */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Department Teachers</Typography>
            <List>
              {dashboardData?.teachers?.length > 0 ? (
                dashboardData.teachers.map((teacher) => (
                  <ListItem key={teacher._id} divider>
                    <ListItemText primary={teacher.name} secondary={teacher.email} />
                  </ListItem>
                ))
              ) : (
                <Typography>No teachers found in this department.</Typography>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Department Classes */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Department Classes</Typography>
            <List>
              {dashboardData?.classes?.length > 0 ? (
                dashboardData.classes.map((cls) => (
                  <ListItem key={cls._id} divider>
                    <ListItemText
                      primary={cls.name}
                      secondary={`Taught by: ${cls.teacher?.name || 'N/A'} | Credits: ${cls.creditsRequired}`}
                    />
                  </ListItem>
                ))
              ) : (
                <Typography>No classes found in this department.</Typography>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Recent Enrollments */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Recent Enrollment Requests</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Student</TableCell>
                    <TableCell>Credits</TableCell>
                    <TableCell>Class</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dashboardData?.enrollments?.length > 0 ? (
                    dashboardData.enrollments.map((enrollment) => (
                      <TableRow key={enrollment._id}>
                        <TableCell>{enrollment.student?.name || 'N/A'}</TableCell>
                        <TableCell>
                          <Chip
                            label={`${enrollment.student?.credits || 0} credits`}
                            color={(enrollment.student?.credits || 0) > 0 ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{enrollment.class?.name || 'N/A'}</TableCell>
                        <TableCell>
                          {enrollment.class?.autoGenerated ? (
                            <Chip label="Auto-Generated" size="small" color="success" variant="outlined" />
                          ) : (
                            <Chip label="Manual" size="small" color="default" variant="outlined" />
                          )}
                        </TableCell>
                        <TableCell>{getStatusChip(enrollment.status)}</TableCell>
                        <TableCell>{new Date(enrollment.createdAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No recent enrollments.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Student Enrollment Management */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Enroll Students in {user?.department} Department
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select students below to enroll them in your department. This will allow them to enroll in classes from your department.
            </Typography>
            
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Student Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Current Department</TableCell>
                    <TableCell>Credits</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {availableStudents?.length > 0 ? (
                    availableStudents.map((student) => (
                      <TableRow key={student._id}>
                        <TableCell>{student.name}</TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell>
                          <Chip
                            label={student.department || 'Not Assigned'}
                            color={student.department ? 'default' : 'warning'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={`${student.credits || 0} credits`}
                            color={(student.credits || 0) > 0 ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => enrollStudent(student._id)}
                            disabled={enrollingStudentId === student._id}
                          >
                            {enrollingStudentId === student._id ? 'Enrolling...' : 'Enroll'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No students available for enrollment.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Absence Management Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Absence Management
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Manage absence requests from teachers and students in your department.
            </Typography>
            <AbsenceManager />
          </Paper>
        </Grid>

        {/* Timetable Upload Section */}
        <Grid item xs={12}>
          <TimetableUpload department={user?.department} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default HodDashboard;
