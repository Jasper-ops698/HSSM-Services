import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, Typography, Snackbar, Alert
} from '@mui/material';
import api from '../../api';
const LOGO_COLOR = '#1976d2';

const TeacherAbsenceModal = ({ open, onClose, classId, userId, refreshAbsences }) => {
  useEffect(() => {
    console.debug('TeacherAbsenceModal mounted, open=', open, 'classId=', classId, 'userId=', userId);
    return () => console.debug('TeacherAbsenceModal unmounted');
  }, [open, classId, userId]);
  const [reason, setReason] = useState('');
  const [date, setDate] = useState('');
  const [duration, setDuration] = useState('');
  const [evidence, setEvidence] = useState(null);
  const [feedback, setFeedback] = useState({ open: false, message: '', severity: 'info' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setEvidence(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    const durationNum = Number(duration);
    if (!reason || !date || duration === '' || isNaN(durationNum) || durationNum <= 0) {
      setFeedback({ open: true, message: 'Please fill all required fields and enter a valid duration (must be a positive number).', severity: 'warning' });
      return;
    }
    console.log('Submitting absence with duration:', duration, 'as number:', durationNum);
    setIsSubmitting(true);
    try {
  const formData = new FormData();
      formData.append('role', 'teacher');
      if (classId) formData.append('class', classId);
      formData.append('reason', reason);
      formData.append('date', date);
      formData.append('duration', durationNum);
      if (evidence) formData.append('evidence', evidence);
      // api instance will attach Authorization header automatically via interceptor
      await api.post('/api/absence', formData);
      setFeedback({ open: true, message: 'Absence application submitted!', severity: 'success' });
      setReason(''); setDate(''); setDuration(''); setEvidence(null);
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
      <DialogTitle sx={{ color: LOGO_COLOR }}>Teacher Absence Application</DialogTitle>
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

export default TeacherAbsenceModal;
