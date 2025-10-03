import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography
} from '@mui/material';


const StudentAbsenceModal = ({ open, onClose, studentId, classOptions, onSubmit }) => {
  const [reason, setReason] = useState('');
  const [absenceType, setAbsenceType] = useState('medical');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [date, setDate] = useState('');

  const handleSubmit = async () => {
    if (!reason) {
      setError('Reason for absence is required.');
      return;
    }
    if (!selectedClass) {
      setError('Class is required.');
      return;
    }
    if (!date) {
      setError('Date of absence is required.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('studentId', studentId);
    formData.append('reason', reason);
    formData.append('absenceType', absenceType);
    formData.append('class', selectedClass);
    formData.append('date', date);
    formData.append('role', 'student');
    if (file) {
      formData.append('file', file);
    }

    try {
      if (onSubmit) {
        await onSubmit(formData);
      }
      setSuccess('Absence request submitted successfully.');
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Request Absence</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}
        <Box component="form" noValidate autoComplete="off" sx={{ mt: 2 }}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Class</InputLabel>
            <Select
              value={selectedClass}
              label="Class"
              onChange={(e) => setSelectedClass(e.target.value)}
              required
            >
              {classOptions && classOptions.length > 0 ? (
                classOptions.map((cls) => (
                  <MenuItem key={cls._id} value={cls._id}>{cls.name}</MenuItem>
                ))
              ) : (
                <MenuItem value="" disabled>No classes available</MenuItem>
              )}
            </Select>
          </FormControl>
          <TextField
            label="Date of Absence"
            type="date"
            fullWidth
            margin="normal"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            required
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Absence Type</InputLabel>
            <Select
              value={absenceType}
              label="Absence Type"
              onChange={(e) => setAbsenceType(e.target.value)}
            >
              <MenuItem value="medical">Medical</MenuItem>
              <MenuItem value="family_emergency">Family Emergency</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Reason for Absence"
            multiline
            rows={4}
            fullWidth
            margin="normal"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />
          <Button variant="contained" component="label" fullWidth sx={{ mt: 2 }}>
            Upload Supporting Document
            <input type="file" hidden onChange={(e) => setFile(e.target.files[0])} />
          </Button>
          {file && <Typography variant="body2" sx={{ mt: 1 }}>{file.name}</Typography>}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button onClick={handleSubmit} color="primary" disabled={loading}>
          {loading ? <CircularProgress size={24} /> : 'Submit'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StudentAbsenceModal;
