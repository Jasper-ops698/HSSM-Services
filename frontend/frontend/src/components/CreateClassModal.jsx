import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  CircularProgress,
  Alert,
  Box,
} from '@mui/material';
import api from '../api';

const CreateClassModal = ({ open, onClose, onClassCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    creditsRequired: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/api/classes/teacher', {
          ...formData,
          creditsRequired: parseInt(formData.creditsRequired),
      });

      setSuccess('Class created successfully!');
      setTimeout(() => {
        setFormData({
          name: '',
          description: '',
          creditsRequired: '',
        });
        setSuccess('');
        onClose();
        if (onClassCreated) {
          onClassCreated(response.data);
        }
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create class');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      creditsRequired: '',
    });
    setError('');
    setSuccess('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Class</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Class Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                autoFocus
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                multiline
                rows={4}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Credits Required"
                name="creditsRequired"
                type="number"
                value={formData.creditsRequired}
                onChange={handleChange}
                required
                inputProps={{ min: 0 }}
                helperText="Number of credits students need to enroll"
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={loading || !formData.name || !formData.description || !formData.creditsRequired}
        >
          {loading ? <CircularProgress size={24} /> : 'Create Class'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateClassModal;