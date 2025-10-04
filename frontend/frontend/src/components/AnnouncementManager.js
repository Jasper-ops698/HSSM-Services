import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Chip,
  Grid,
  Typography,
  Paper,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import { Announcement as AnnouncementIcon, Add } from '@mui/icons-material';
import api from '../api';

const CreateAnnouncementModal = ({ open, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    targetRoles: ['all'],
    priority: 'medium',
    endDate: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.message) {
      setError('Title and message are required');
      return;
    }
    
    setIsLoading(true);
    try {
      await api.post('/api/announcements', formData);
      
      // Reset form and close modal
      setFormData({
        title: '',
        message: '',
        targetRoles: ['all'],
        priority: 'medium',
        endDate: '',
      });
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create announcement');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <AnnouncementIcon sx={{ mr: 1 }} />
          Create New Announcement
        </Box>
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ p: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                name="title"
                label="Announcement Title"
                value={formData.title}
                onChange={handleInputChange}
                fullWidth
                required
                sx={{ mb: 2 }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                name="message"
                label="Announcement Message"
                value={formData.message}
                onChange={handleInputChange}
                multiline
                rows={5}
                fullWidth
                required
                sx={{ mb: 2 }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Target Audience</InputLabel>
                <Select
                  name="targetRoles"
                  value={formData.targetRoles}
                  onChange={handleInputChange}
                  multiple
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} />
                      ))}
                    </Box>
                  )}
                >
                  <MenuItem value="all">Everyone</MenuItem>
                  <MenuItem value="student">Students</MenuItem>
                  <MenuItem value="teacher">Teachers</MenuItem>
                  <MenuItem value="HOD">HODs</MenuItem>
                </Select>
                <FormHelperText>Who should see this announcement</FormHelperText>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Priority</InputLabel>
                <Select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                </Select>
                <FormHelperText>Higher priority announcements appear first</FormHelperText>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                name="endDate"
                label="End Date (Optional)"
                type="date"
                value={formData.endDate}
                onChange={handleInputChange}
                InputLabelProps={{ shrink: true }}
                fullWidth
                helperText="Date when this announcement should no longer be shown (leave empty for indefinite)"
              />
            </Grid>
            
            {error && (
              <Grid item xs={12}>
                <Alert severity="error">{error}</Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={onClose} color="inherit">Cancel</Button>
          <Button 
            type="submit" 
            variant="contained" 
            color="primary" 
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : null}
          >
            {isLoading ? 'Creating...' : 'Create Announcement'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

const AnnouncementManager = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  const fetchAnnouncements = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/announcements');
      setAnnouncements(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch announcements');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleCreateSuccess = () => {
    setSuccess('Announcement created successfully');
    fetchAnnouncements();
  };

  const handleToggleActive = async (announcement) => {
    try {
      await api.put(`/api/announcements/${announcement._id}`, { active: !announcement.active });
      
      setSuccess(`Announcement ${announcement.active ? 'deactivated' : 'activated'}`);
      fetchAnnouncements();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update announcement');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          <AnnouncementIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Manage Announcements
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<Add />}
          onClick={() => setOpenModal(true)}
        >
          Create Announcement
        </Button>
      </Box>
      
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : announcements.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">
            No announcements found. Create one to keep your students informed.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {announcements.map(announcement => (
            <Grid item xs={12} key={announcement._id}>
              <Paper 
                elevation={2} 
                sx={{ 
                  p: 2, 
                  borderLeft: announcement.priority === 'high' 
                    ? '4px solid #f44336' 
                    : announcement.priority === 'medium'
                    ? '4px solid #ff9800'
                    : '4px solid #4caf50',
                  opacity: announcement.active ? 1 : 0.6
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="h6">{announcement.title}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Created: {new Date(announcement.createdAt).toLocaleString()}
                    </Typography>
                    <Typography variant="body1">{announcement.message}</Typography>
                  </Box>
                  <Box>
                    <Button 
                      variant={announcement.active ? "outlined" : "contained"} 
                      color={announcement.active ? "error" : "success"}
                      size="small"
                      onClick={() => handleToggleActive(announcement)}
                    >
                      {announcement.active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
      
      <CreateAnnouncementModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSuccess={handleCreateSuccess}
      />
      
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

export default AnnouncementManager;
