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
  Divider,
  Avatar
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  HourglassEmpty,
  ExpandMore,
  Person,
  Class,
  Event,
  Description,
  AttachFile
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

import { API_BASE_URL } from '../config';

// Centralized API utility
const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const AbsenceManager = () => {
  const { user } = useAuth();
  const [absences, setAbsences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openResponseDialog, setOpenResponseDialog] = useState(false);
  const [selectedAbsence, setSelectedAbsence] = useState(null);
  const [responseData, setResponseData] = useState({
    status: '',
    notes: ''
  });
  const [openReplacementDialog, setOpenReplacementDialog] = useState(false);
  const [availableTeachers, setAvailableTeachers] = useState([]);
  const [selectedReplacement, setSelectedReplacement] = useState('');

  // Fetch absences based on user role
  const fetchAbsences = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      let endpoint = '/api/absence/teacher'; // Default for teachers
      if (user?.role === 'HOD') {
        endpoint = '/api/absence'; // HODs get all absences in their department
      }

      const response = await api.get(endpoint);
      setAbsences(response.data);
    } catch (err) {
      console.error('Error fetching absences:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch absence requests. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    if (user) {
      fetchAbsences();
    }
  }, [user, fetchAbsences]);

  // Handle absence response
  const handleRespondToAbsence = async () => {
    if (!selectedAbsence || !responseData.status) return;

    try {
      setIsSubmitting(true);

      await api.post('/api/absence/respond', {
        absenceId: selectedAbsence._id,
        status: responseData.status,
        notes: responseData.notes
      });

      // Refresh absences
      await fetchAbsences();

      // If HOD approved a teacher absence and no replacement assigned, open replacement modal
      if (
        responseData.status === 'approved' &&
        user?.role === 'HOD' &&
        selectedAbsence.teacher &&
        !selectedAbsence.replacementTeacher
      ) {
        // Refetch the latest absence object to get its updated status
        const refreshed = await api.get(`/api/absence/${selectedAbsence._id}`);
        setSelectedAbsence(refreshed.data);
        setSelectedReplacement('');
        // Fetch available teachers for replacement
        try {
          const response = await api.get('/api/hod/teachers');
          const available = response.data.filter(teacher =>
            teacher._id !== selectedAbsence.teacher._id
          );
          setAvailableTeachers(available);
        } catch (err) {
          setAvailableTeachers([]);
        }
        setOpenReplacementDialog(true);
      }

      // Close dialog and reset
      setOpenResponseDialog(false);
      setResponseData({ status: '', notes: '' });

      alert(`Absence ${responseData.status.toLowerCase()} successfully!`);
    } catch (err) {
      console.error('Error responding to absence:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to respond to absence. Please try again.';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open response dialog
  const openResponseDialogHandler = (absence) => {
    setSelectedAbsence(absence);
    setResponseData({ status: '', notes: '' });
    setOpenResponseDialog(true);
  };

  // Open replacement dialog
  const openReplacementDialogHandler = async (absence) => {
    setSelectedAbsence(absence);
    setSelectedReplacement('');

    // Fetch available teachers for replacement
    try {
      const response = await api.get('/api/hod/teachers');
      // Filter out the absent teacher
      const available = response.data.filter(teacher =>
        teacher._id !== absence.teacher._id
      );
      setAvailableTeachers(available);
    } catch (err) {
      console.error('Error fetching teachers:', err);
      alert('Failed to fetch available teachers.');
      return;
    }

    setOpenReplacementDialog(true);
  };

  // Handle replacement assignment
  const handleAssignReplacement = async () => {
    if (!selectedAbsence || !selectedReplacement) return;

    try {
      setIsSubmitting(true);

      await api.post('/api/absence/assign-replacement', {
        absenceId: selectedAbsence._id,
        replacementTeacherId: selectedReplacement
      });

      // Refresh absences
      await fetchAbsences();

      // Close dialog and reset
      setOpenReplacementDialog(false);
      setSelectedAbsence(null);
      setSelectedReplacement('');
      setAvailableTeachers([]);

      alert('Replacement assigned successfully!');
    } catch (err) {
      console.error('Error assigning replacement:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to assign replacement. Please try again.';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };


  // Normalize status to lowercase for all checks
  const normalizeStatus = (status) => (status ? status.toLowerCase() : '');

  // Group absences by class
  const groupAbsencesByClass = () => {
    const grouped = {};
    absences.forEach(absence => {
      const classId = absence.class?._id || 'no-class';
      if (!grouped[classId]) {
        grouped[classId] = {
          class: absence.class || { name: 'No Class Assigned' },
          absences: []
        };
      }
      grouped[classId].absences.push(absence);
    });
    return Object.values(grouped);
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (normalizeStatus(status)) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (normalizeStatus(status)) {
      case 'approved': return <CheckCircle />;
      case 'rejected': return <Cancel />;
      case 'pending': return <HourglassEmpty />;
      default: return null;
    }
  };

  // Get role color
  const getRoleColor = (role) => {
    return role === 'teacher' ? 'primary' : 'secondary';
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


  const groupedAbsences = groupAbsencesByClass();
  const pendingAbsences = absences.filter(a => normalizeStatus(a.status) === 'pending');

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Absence Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Review and respond to absence requests for your classes
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
              <Typography variant="h4">{pendingAbsences.length}</Typography>
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
                {absences.filter(a => a.status === 'approved').length}
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
                {absences.filter(a => a.status === 'rejected').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Absence Requests by Class */}
      {groupedAbsences.length > 0 ? (
        groupedAbsences.map(({ class: classInfo, absences: classAbsences }) => (
          <Accordion key={classInfo._id || 'no-class'} sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <Class sx={{ mr: 1 }} />
                <Typography sx={{ flexGrow: 1 }}>{classInfo.name}</Typography>
                <Chip
                  label={`${classAbsences.length} requests`}
                  size="small"
                  color="primary"
                  sx={{ mr: 1 }}
                />
                <Chip
                  label={`${classAbsences.filter(a => a.status === 'pending').length} pending`}
                  size="small"
                  color="warning"
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                {classAbsences.map((absence, index) => (
                  <React.Fragment key={absence._id}>
                    <ListItem sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 1 }}>
                        <Avatar sx={{ mr: 2, bgcolor: getRoleColor(absence.role) === 'primary' ? 'primary.main' : 'secondary.main' }}>
                          <Person />
                        </Avatar>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="subtitle1">
                            {absence.teacher?.name || absence.student?.name || 'Unknown'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {absence.teacher?.email || absence.student?.email || 'No email'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Chip
                            label={absence.role}
                            size="small"
                            color={getRoleColor(absence.role)}
                          />
                          <Chip
                            icon={getStatusIcon(absence.status)}
                            label={absence.status}
                            color={getStatusColor(absence.status)}
                            size="small"
                          />
                        </Box>
                      </Box>

                      <Box sx={{ width: '100%', mb: 1 }}>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                              <Event sx={{ mr: 0.5, fontSize: 16 }} />
                              Date: {new Date(absence.dateOfAbsence).toLocaleDateString()}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                              <Description sx={{ mr: 0.5, fontSize: 16 }} />
                              {(() => {
                                const dur = Number(absence.duration);
                                return dur > 0
                                  ? `Duration: ${dur} ${dur === 1 ? 'day' : 'days'}`
                                  : 'Duration: N/A';
                              })()}
                            </Typography>
                          </Grid>
                        </Grid>

                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Reason: {absence.reason}
                        </Typography>

                        {absence.evidence && (
                          <Typography variant="body2" sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                            <AttachFile sx={{ mr: 0.5, fontSize: 16 }} />
                            Evidence: {absence.evidence}
                          </Typography>
                        )}

                        {absence.notes && (
                          <Box sx={{ mt: 1, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                              <Description sx={{ mr: 0.5, fontSize: 16 }} />
                              Notes: {absence.notes}
                            </Typography>
                          </Box>
                        )}
                      </Box>

                      {normalizeStatus(absence.status) === 'pending' && user?.role === 'HOD' && (
                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            startIcon={<CheckCircle />}
                            onClick={() => openResponseDialogHandler(absence)}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            startIcon={<Cancel />}
                            onClick={() => openResponseDialogHandler(absence)}
                          >
                            Reject
                          </Button>
                        </Box>
                      )}

                      {normalizeStatus(absence.status) === 'approved' && user?.role === 'HOD' && !absence.replacementTeacher && (
                        <Box sx={{ mt: 1 }}>
                          <Button
                            variant="outlined"
                            color="primary"
                            size="small"
                            onClick={() => openReplacementDialogHandler(absence)}
                          >
                            Assign Replacement
                          </Button>
                        </Box>
                      )}

                      {absence.replacementTeacher && (
                        <Box sx={{ mt: 1, p: 1, bgcolor: 'success.light', borderRadius: 1 }}>
                          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                            <Person sx={{ mr: 0.5, fontSize: 16 }} />
                            Replacement: {absence.replacementTeacher.name}
                          </Typography>
                        </Box>
                      )}
                    </ListItem>
                    {index < classAbsences.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        ))
      ) : (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No absence requests found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Students and teachers will appear here when they submit absence requests
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
          Respond to Absence Request
        </DialogTitle>
        <DialogContent>
          {selectedAbsence && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="subtitle1" gutterBottom>
                {(
                  selectedAbsence.teacher?.name ||
                  selectedAbsence.student?.name ||
                  'Unknown'
                ) +
                  ' (' +
                  (selectedAbsence.teacher
                    ? 'teacher'
                    : selectedAbsence.student
                    ? 'student'
                    :
                      '') +
                  ')'}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Class: {selectedAbsence.class?.name || 'No Class Assigned'}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Date: {new Date(selectedAbsence.dateOfAbsence).toLocaleDateString()}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {(() => {
                  const dur = Number(selectedAbsence.duration);
                  return dur > 0
                    ? `Duration: ${dur} ${dur === 1 ? 'day' : 'days'}`
                    : 'Duration: N/A';
                })()}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Reason: {selectedAbsence.reason}
              </Typography>

              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Response</InputLabel>
                <Select
                  value={responseData.status}
                  onChange={(e) => setResponseData(prev => ({ ...prev, status: e.target.value }))}
                  label="Response"
                >
                  <MenuItem value="approved">Approve</MenuItem>
                  <MenuItem value="rejected">Reject</MenuItem>
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
                placeholder="Add any notes for the requestor..."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenResponseDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleRespondToAbsence}
            variant="contained"
            disabled={!responseData.status || isSubmitting}
            color={responseData.status === 'approved' ? 'success' : 'error'}
          >
            {isSubmitting ? <CircularProgress size={20} /> : responseData.status}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Replacement Assignment Dialog */}
      <Dialog
        open={openReplacementDialog}
        onClose={() => setOpenReplacementDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Assign Replacement Teacher
        </DialogTitle>
        <DialogContent>
          {selectedAbsence && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="subtitle1" gutterBottom>
                Absence Details
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Teacher: {selectedAbsence.teacher?.name || 'Unknown'}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Class: {selectedAbsence.class?.name || 'No Class Assigned'}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Date: {new Date(selectedAbsence.dateOfAbsence).toLocaleDateString()}
              </Typography>

              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Select Replacement Teacher</InputLabel>
                <Select
                  value={selectedReplacement}
                  onChange={(e) => setSelectedReplacement(e.target.value)}
                  label="Select Replacement Teacher"
                >
                  {availableTeachers.map(teacher => (
                    <MenuItem key={teacher._id} value={teacher._id}>
                      {teacher.name} ({teacher.email})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenReplacementDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAssignReplacement}
            variant="contained"
            disabled={!selectedReplacement || isSubmitting}
            color="primary"
          >
            {isSubmitting ? <CircularProgress size={20} /> : 'Assign Replacement'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AbsenceManager;