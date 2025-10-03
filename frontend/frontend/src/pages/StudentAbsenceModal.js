import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, Typography, Snackbar, Alert, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import api from '../api';
const LOGO_COLOR = '#1976d2';

const StudentAbsenceModal = ({ open, onClose, enrolledClasses, userId, refreshAbsences }) => {
  useEffect(() => {
    console.debug('StudentAbsenceModal mounted, open=', open, 'enrolledClasses=', enrolledClasses, 'userId=', userId);
    return () => console.debug('StudentAbsenceModal unmounted');
  }, [open, enrolledClasses, userId]);
  const [reason, setReason] = useState('');
  const [date, setDate] = useState('');
  const [duration, setDuration] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [evidence, setEvidence] = useState(null);
  const [feedback, setFeedback] = useState({ open: false, message: '', severity: 'info' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Normalize enrolledClasses to objects with {_id, name}
  const classOptions = React.useMemo(() => {
    if (!enrolledClasses) return [];
    // If array of strings (IDs), we don't have names, so just expose ids
    if (Array.isArray(enrolledClasses) && enrolledClasses.length > 0 && typeof enrolledClasses[0] === 'string') {
      return enrolledClasses.map(id => ({ _id: id, name: id }));
    }
    // If array of objects, map to {_id, name}
    if (Array.isArray(enrolledClasses)) {
      return enrolledClasses.map(c => ({ _id: c._id || c, name: c.name || String(c._id || c) }));
    }
    return [];
  }, [enrolledClasses]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setEvidence(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!reason || !date || !duration || !selectedClass) {
      setFeedback({ open: true, message: 'Please fill all required fields.', severity: 'warning' });
      return;
    }
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('role', 'student');
      formData.append('class', selectedClass);
      formData.append('reason', reason);
      formData.append('date', date);
      formData.append('duration', duration);
      if (evidence) formData.append('evidence', evidence);
      await api.post('/api/absences', formData);
      setFeedback({ open: true, message: 'Absence application submitted!', severity: 'success' });
      setReason(''); setDate(''); setDuration(''); setSelectedClass(''); setEvidence(null);
      if (refreshAbsences) refreshAbsences();
      onClose();
    } catch (err) {
      setFeedback({ open: true, message: 'Failed to submit absence.', severity: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ color: LOGO_COLOR }}>Student Absence Application</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Please fill in the details below to apply for absence. Evidence attachment is optional.
        </Typography>
        <TextField
          label="Reason for Absence"
          fullWidth
          required
          value={reason}
          onChange={e => setReason(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          label="Date of Absence"
          type="date"
          fullWidth
          required
          value={date}
          onChange={e => setDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ mb: 2 }}
        />
        <TextField
          label="Duration (days)"
          type="number"
          fullWidth
          required
          value={duration}
          onChange={e => setDuration(e.target.value)}
          sx={{ mb: 2 }}
        />
        <FormControl fullWidth required sx={{ mb: 2 }}>
          <InputLabel>Select Class</InputLabel>
          <Select
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
            label="Select Class"
          >
            {classOptions && classOptions.map(cls => (
              <MenuItem key={cls._id} value={cls._id}>
                {cls.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Box sx={{ mb: 2 }}>
          <Button variant="outlined" component="label" sx={{ bgcolor: '#e3f2fd', color: LOGO_COLOR }}>
            {evidence ? 'Change Evidence' : 'Add Evidence (Optional)'}
            <input type="file" hidden onChange={handleFileChange} accept="image/*,application/pdf,.doc,.docx" />
          </Button>
          {evidence && (
            <Typography variant="caption" sx={{ ml: 2 }}>
              Selected: {evidence.name}
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary" sx={{ bgcolor: LOGO_COLOR }} disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </Button>
      </DialogActions>
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
    </Dialog>
  );
};

export default StudentAbsenceModal;
