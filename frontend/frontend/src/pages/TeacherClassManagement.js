import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Tabs,
  Tab,
  Card,
  CardMedia,
  Button,
  CircularProgress,
  Alert,
  Snackbar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider
} from '@mui/material';
import { 
  Class as ClassIcon, 
  Schedule,
  ArrowBack
} from '@mui/icons-material';
import api from '../api';
import assetUrl from '../utils/assetUrl';
import { useNavigate } from 'react-router-dom';
import TeacherClassVenue from '../components/TeacherClassVenue';
const FALLBACK_IMAGE_URL = assetUrl('/uploads/placeholder-image.png');

// TabPanel Component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`class-tabpanel-${index}`}
      aria-labelledby={`class-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const TeacherClassManagement = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  // Fetch teacher's classes
  useEffect(() => {
    const fetchClasses = async () => {
      setLoading(true);
      try {
        const response = await api.get('/api/teacher/classes');
        setClasses(response.data);
        if (response.data.length > 0) {
          setSelectedClass(response.data[0]);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch classes');
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, []);

  // Fetch enrollments for selected class
  useEffect(() => {
    const fetchEnrollments = async () => {
      if (!selectedClass) return;
      
      setLoading(true);
      try {
  // token not used here; api client handles auth
        const response = await api.get(`/api/enrollments/class/${selectedClass._id}`);
        setEnrollments(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch enrollments');
      } finally {
        setLoading(false);
      }
    };

    fetchEnrollments();
  }, [selectedClass]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleClassSelect = (cls) => {
    setSelectedClass(cls);
    setTabValue(0); // Reset to first tab
  };

  // Enrollment Management Handlers
  const handleApproveEnrollment = async (enrollmentId) => {
    setLoading(true);
    try {
  // token not used here; api client handles auth
      await api.post(`/api/enrollments/respond`, { enrollmentId, status: 'Approved' });
      
      // Update enrollment status in local state
      setEnrollments(prev => prev.map(enrollment => 
        enrollment._id === enrollmentId 
          ? { ...enrollment, status: 'Approved' } 
          : enrollment
      ));
      
      setSuccess('Enrollment approved successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve enrollment');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectEnrollment = async (enrollmentId) => {
    setLoading(true);
    try {
  // token not used here; api client handles auth
      await api.post(`/api/enrollments/respond`, { enrollmentId, status: 'Rejected' });
      
      // Update enrollment status in local state
      setEnrollments(prev => prev.map(enrollment => 
        enrollment._id === enrollmentId 
          ? { ...enrollment, status: 'Rejected' } 
          : enrollment
      ));
      
      setSuccess('Enrollment rejected successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject enrollment');
    } finally {
      setLoading(false);
    }
  };

  if (loading && classes.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Back Button */}
      <Box sx={{ mb: 2 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/teacher-dashboard')}
          variant="outlined"
          sx={{ mb: 2 }}
        >
          Back to Dashboard
        </Button>
      </Box>

      <Typography variant="h4" gutterBottom>
        Manage Your Classes
      </Typography>

      <Grid container spacing={3}>
        {/* Class List Sidebar */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Your Classes
            </Typography>
            {classes.length === 0 ? (
              <Typography color="text.secondary" sx={{ textAlign: 'center', mt: 3 }}>
                No classes have been assigned to you yet. Please reach out to your HOD if you need a new class created.
              </Typography>
            ) : (
              <List>
                {classes.map((cls) => (
                  <ListItem 
                    button 
                    key={cls._id}
                    selected={selectedClass?._id === cls._id}
                    onClick={() => handleClassSelect(cls)}
                    sx={{ 
                      mb: 1, 
                      borderRadius: 1,
                      bgcolor: selectedClass?._id === cls._id ? 'primary.light' : 'background.paper',
                      '&:hover': { bgcolor: selectedClass?._id === cls._id ? 'primary.light' : 'action.hover' }
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <ClassIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText 
                      primary={cls.name} 
                      secondary={`${cls.enrolledStudents?.length || 0} students`} 
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Class Details and Management */}
        <Grid item xs={12} md={8}>
          {selectedClass ? (
            <Paper elevation={3} sx={{ p: 0 }}>
              {/* Class Header */}
              <Box sx={{ p: 3, bgcolor: 'primary.light', borderRadius: '4px 4px 0 0' }}>
                <Typography variant="h5" component="h2">
                  {selectedClass.name}
                </Typography>
                <Typography variant="subtitle1" sx={{ mt: 1 }}>
                  Department: {selectedClass.department}
                </Typography>
                <Typography variant="subtitle2">
                  Credits: {selectedClass.creditsRequired}
                </Typography>
              </Box>

              {/* Tabs */}
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabValue} onChange={handleTabChange} aria-label="class management tabs">
                  <Tab label="Class Details" />
                  <Tab label="Students" />
                  <Tab label="Venue Management" />
                </Tabs>
              </Box>

              {/* Class Details Tab */}
              <TabPanel value={tabValue} index={0}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Card>
                      <CardMedia
                        component="img"
                        height="140"
                        image={selectedClass.image ? assetUrl(selectedClass.image.replace(/\\/g, '/')) : FALLBACK_IMAGE_URL}
                        alt={selectedClass.name}
                      />
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={8}>
                    <Typography variant="h6" gutterBottom>
                      Description
                    </Typography>
                    <Typography paragraph>
                      {selectedClass.description || 'No description provided.'}
                    </Typography>
                    
                    <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                      Timetable
                    </Typography>
                    {selectedClass.timetable && selectedClass.timetable.length > 0 ? (
                      <List>
                        {selectedClass.timetable.map((slot, index) => (
                          <ListItem key={index}>
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: 'secondary.main' }}>
                                <Schedule />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText 
                              primary={`${slot.day}`} 
                              secondary={`${slot.startTime} - ${slot.endTime}`} 
                            />
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography color="text.secondary">
                        No timetable entries found.
                      </Typography>
                    )}
                    
                    <Alert severity="info" sx={{ mt: 3 }}>
                      Class details are managed by your HOD. If you need changes, please reach out to them directly.
                    </Alert>
                  </Grid>
                </Grid>
              </TabPanel>

              {/* Students Tab */}
              <TabPanel value={tabValue} index={1}>
                <Typography variant="h6" gutterBottom>
                  Enrolled Students
                </Typography>
                {selectedClass.enrolledStudents && selectedClass.enrolledStudents.length > 0 ? (
                  <List>
                    {selectedClass.enrolledStudents.map((student) => (
                      <ListItem key={student._id} divider>
                        <ListItemAvatar>
                          <Avatar>{student.name ? student.name.charAt(0) : 'S'}</Avatar>
                        </ListItemAvatar>
                        <ListItemText 
                          primary={student.name} 
                          secondary={student.email} 
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography color="text.secondary">
                    No students enrolled in this class yet.
                  </Typography>
                )}
                
                <Divider sx={{ my: 3 }} />
                
                <Typography variant="h6" gutterBottom>
                  Pending Enrollment Requests
                </Typography>
                {enrollments && enrollments.filter(e => e.status === 'pending').length > 0 ? (
                  <List>
                    {enrollments
                      .filter(e => e.status === 'pending')
                      .map((enrollment) => (
                        <ListItem key={enrollment._id} divider>
                          <ListItemAvatar>
                            <Avatar>{enrollment.student?.name ? enrollment.student.name.charAt(0) : 'S'}</Avatar>
                          </ListItemAvatar>
                          <ListItemText 
                            primary={enrollment.student?.name} 
                            secondary={`Request date: ${new Date(enrollment.createdAt).toLocaleDateString()}`} 
                          />
                          <Box>
                            <Button 
                              color="primary" 
                              variant="contained" 
                              size="small" 
                              sx={{ mr: 1 }}
                              onClick={() => handleApproveEnrollment(enrollment._id)}
                            >
                              Approve
                            </Button>
                            <Button 
                              color="error" 
                              variant="outlined" 
                              size="small"
                              onClick={() => handleRejectEnrollment(enrollment._id)}
                            >
                              Reject
                            </Button>
                          </Box>
                        </ListItem>
                      ))}
                  </List>
                ) : (
                  <Typography color="text.secondary">
                    No pending enrollment requests.
                  </Typography>
                )}
              </TabPanel>

              {/* Venue Management Tab */}
              <TabPanel value={tabValue} index={2}>
                <TeacherClassVenue classId={selectedClass._id} />
              </TabPanel>
            </Paper>
          ) : (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                No class selected or none have been assigned to you yet.
              </Typography>
              <Alert severity="info">
                Class creation and updates are coordinated by your HOD. Please contact them if you need assistance.
              </Alert>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Error Snackbar */}
      <Snackbar 
        open={Boolean(error)} 
        autoHideDuration={6000} 
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
      
      {/* Success Snackbar */}
      <Snackbar 
        open={Boolean(success)} 
        autoHideDuration={4000} 
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccess(null)} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>

    </Box>
  );
};

export default TeacherClassManagement;
