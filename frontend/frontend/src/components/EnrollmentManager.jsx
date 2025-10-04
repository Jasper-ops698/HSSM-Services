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
  Chip,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  Divider
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  HourglassEmpty,
  ExpandMore,
  Person,
  Class,
  CreditCard,
  Message
} from '@mui/icons-material';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const EnrollmentManager = ({ openClassId = null }) => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openResponseDialog, setOpenResponseDialog] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [responseData, setResponseData] = useState({
    status: '',
    notes: ''
  });

  // Track which class accordion is expanded. Keep hooks at top level (before early returns)
  const [expandedClassId, setExpandedClassId] = useState(null);

  useEffect(() => {
    if (openClassId) {
      setExpandedClassId(openClassId);
      // scroll into view of the expanded accordion after next paint
      setTimeout(() => {
        const el = document.querySelector(`[data-class-id="${openClassId}"]`);
        if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
    }
  }, [openClassId]);

  // Fetch enrollments for teacher's classes
  const fetchEnrollments = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // First get teacher's classes
      const classesRes = await api.get('/api/teacher/classes');
      const teacherClasses = classesRes.data;

      // Then get enrollments for each class
      const enrollmentPromises = teacherClasses.map(cls =>
        api.get(`/api/enrollments/class/${cls._id}`)
      );

      const enrollmentResults = await Promise.all(enrollmentPromises);
      const allEnrollments = enrollmentResults.flatMap(result => result.data);

      setEnrollments(allEnrollments);
    } catch (err) {
      console.error('Error fetching enrollments:', err);
      setError('Failed to fetch enrollment requests. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchEnrollments();
    }
  }, [user, fetchEnrollments]);

  // If a parent requests focus on a specific class (via openClassId), refresh the enrollments
  // so the teacher sees the most up-to-date requests for that class.
  useEffect(() => {
    if (openClassId) {
      // Refresh list when teacher focuses a class from a notification
      fetchEnrollments();
    }
  }, [openClassId, fetchEnrollments]);

  // Handle enrollment response
  const handleRespondToEnrollment = async () => {
    if (!selectedEnrollment || !responseData.status) return;

    try {
      setIsSubmitting(true);

      await api.post('/api/enrollments/respond', {
        enrollmentId: selectedEnrollment._id,
        status: responseData.status,
        notes: responseData.notes
      });

      // Refresh enrollments
      await fetchEnrollments();

      // Close dialog and reset
      setOpenResponseDialog(false);
      setSelectedEnrollment(null);
      setResponseData({ status: '', notes: '' });

      alert(`Enrollment ${responseData.status.toLowerCase()} successfully!`);
    } catch (err) {
      console.error('Error responding to enrollment:', err);
      alert('Failed to respond to enrollment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open response dialog
  const openResponseDialogHandler = (enrollment) => {
    setSelectedEnrollment(enrollment);
    setResponseData({ status: '', notes: '' });
    setOpenResponseDialog(true);
  };

  // Group enrollments by class
  const groupEnrollmentsByClass = () => {
    const grouped = {};
    enrollments.forEach(enrollment => {
      const classId = enrollment.class._id;
      if (!grouped[classId]) {
        grouped[classId] = {
          class: enrollment.class,
          enrollments: []
        };
      }
      grouped[classId].enrollments.push(enrollment);
    });
    return Object.values(grouped);
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved': return 'success';
      case 'Rejected': return 'error';
      case 'Pending': return 'warning';
      default: return 'default';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'Approved': return <CheckCircle />;
      case 'Rejected': return <Cancel />;
      case 'Pending': return <HourglassEmpty />;
      default: return null;
    }
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

  const groupedEnrollments = groupEnrollmentsByClass();
  const pendingEnrollments = enrollments.filter(e => e.status === 'Pending');

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Enrollment Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Review and respond to student enrollment requests for your classes
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                <HourglassEmpty sx={{ mr: 1, color: 'warning.main' }} /> Pending Requests
              </Typography>
              <Typography variant="h4">{pendingEnrollments.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                <CheckCircle sx={{ mr: 1, color: 'success.main' }} /> Approved
              </Typography>
              <Typography variant="h4">
                {enrollments.filter(e => e.status === 'Approved').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                <Cancel sx={{ mr: 1, color: 'error.main' }} /> Rejected
              </Typography>
              <Typography variant="h4">
                {enrollments.filter(e => e.status === 'Rejected').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Enrollment Requests by Class */}
      {groupedEnrollments.length > 0 ? (
        groupedEnrollments.map(({ class: classInfo, enrollments: classEnrollments }) => (
          <Accordion
            key={classInfo._id}
            sx={{ mb: 2 }}
            expanded={expandedClassId === classInfo._id}
            onChange={() => setExpandedClassId(prev => (prev === classInfo._id ? null : classInfo._id))}
            data-class-id={classInfo._id}
          >
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <Class sx={{ mr: 1 }} />
                <Typography sx={{ flexGrow: 1 }}>{classInfo.name}</Typography>
                {classInfo.autoGenerated && (
                  <Chip 
                    label="Auto-Generated" 
                    size="small" 
                    color="success" 
                    variant="outlined"
                    sx={{ mr: 1 }}
                  />
                )}
                <Chip
                  label={`${classEnrollments.length} requests`}
                  size="small"
                  color="primary"
                  sx={{ mr: 1 }}
                />
                <Chip
                  label={`${classEnrollments.filter(e => e.status === 'Pending').length} pending`}
                  size="small"
                  color="warning"
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                {classEnrollments.map((enrollment, index) => (
                  <React.Fragment key={enrollment._id}>
                    <ListItem sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 1 }}>
                        <Person sx={{ mr: 1 }} />
                        <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                          {enrollment.student.name}
                        </Typography>
                        <Chip
                          icon={getStatusIcon(enrollment.status)}
                          label={enrollment.status}
                          color={getStatusColor(enrollment.status)}
                          size="small"
                        />
                      </Box>

                      <Box sx={{ width: '100%', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Email: {enrollment.student.email}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Requested: {new Date(enrollment.createdAt).toLocaleDateString()}
                        </Typography>
                        {enrollment.status === 'Approved' && (
                          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                            <CreditCard sx={{ mr: 0.5, fontSize: 16 }} />
                            Credits deducted: {classInfo.creditsRequired}
                          </Typography>
                        )}
                        {enrollment.notes && (
                          <Box sx={{ mt: 1, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                              <Message sx={{ mr: 0.5, fontSize: 16 }} />
                              Notes: {enrollment.notes}
                            </Typography>
                          </Box>
                        )}
                      </Box>

                      {enrollment.status === 'Pending' && (
                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            startIcon={<CheckCircle />}
                            onClick={() => openResponseDialogHandler(enrollment)}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            startIcon={<Cancel />}
                            onClick={() => openResponseDialogHandler(enrollment)}
                          >
                            Reject
                          </Button>
                        </Box>
                      )}
                    </ListItem>
                    {index < classEnrollments.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        ))
      ) : (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No enrollment requests found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Students will appear here when they request to enroll in your classes
          </Typography>
        </Paper>
      )}

      {/* Response Dialog */}
      <Dialog
        open={openResponseDialog}
        onClose={() => setOpenResponseDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Respond to Enrollment Request
        </DialogTitle>
        <DialogContent>
          {selectedEnrollment && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="subtitle1" gutterBottom>
                Student: {selectedEnrollment.student.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Class: {selectedEnrollment.class.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Credits Required: {selectedEnrollment.class.creditsRequired}
              </Typography>

              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Response</InputLabel>
                <Select
                  value={responseData.status}
                  onChange={(e) => setResponseData(prev => ({ ...prev, status: e.target.value }))}
                  label="Response"
                >
                  <MenuItem value="Approved">Approve</MenuItem>
                  <MenuItem value="Rejected">Reject</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notes (optional)"
                value={responseData.notes}
                onChange={(e) => setResponseData(prev => ({ ...prev, notes: e.target.value }))}
                sx={{ mt: 2 }}
                placeholder="Add any notes for the student..."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenResponseDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleRespondToEnrollment}
            variant="contained"
            disabled={!responseData.status || isSubmitting}
            color={responseData.status === 'Approved' ? 'success' : 'error'}
          >
            {isSubmitting ? <CircularProgress size={20} /> : responseData.status}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EnrollmentManager;