import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  TextField,
  Paper,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  IconButton,
  Divider,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import { Edit, Add, LocationOn } from '@mui/icons-material';
import api from '../api';

const TeacherClassVenue = ({ classId }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [formData, setFormData] = useState({
    venue: '',
    message: '',
    active: true
  });

  const fetchAnnouncements = useCallback(async () => {
    if (!classId) return;
    
    setIsLoading(true);
    try {
      const response = await api.get(`/api/teacher/class/${classId}/venue-announcements`);
      setAnnouncements(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch venue announcements');
    } finally {
      setIsLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    if (classId) {
      fetchAnnouncements();
    }
  }, [classId, fetchAnnouncements]);

  const handleInputChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'active' ? checked : value
    });
  };

  const handleDialogOpen = (announcement = null) => {
    if (announcement) {
      setEditingAnnouncement(announcement);
      setFormData({
        venue: announcement.venue?.name || '',
        message: announcement.message || '',
        active: announcement.active
      });
    } else {
      setEditingAnnouncement(null);
      setFormData({
        venue: '',
        message: '',
        active: true
      });
    }
    setOpenDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setEditingAnnouncement(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.venue) {
      setError('Venue is required');
      return;
    }

    setIsLoading(true);
    try {

      if (editingAnnouncement) {
        await api.put(
          `/api/teacher/class/${classId}/venue-announcement/${editingAnnouncement._id}`,
          formData
        );
        setSuccess('Venue announcement updated successfully');
      } else {
        await api.post(
          `/api/teacher/class/${classId}/venue-announcement`,
          formData
        );
        setSuccess('Venue announcement created successfully');
      }

      fetchAnnouncements();
      handleDialogClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save venue announcement');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (announcement) => {
    try {
      await api.put(
        `/api/teacher/class/${classId}/venue-announcement/${announcement._id}`,
        { ...announcement, active: !announcement.active }
      );

      // Update local state
      setAnnouncements(announcements.map(a => 
        a._id === announcement._id ? { ...a, active: !a.active } : a
      ));
      
      setSuccess(`Announcement ${!announcement.active ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update venue announcement');
    }
  };

  if (!classId) {
    return <Typography>Please select a class to manage venue announcements</Typography>;
  }

  return (
    <Paper elevation={2} sx={{ p: 3, mt: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
          <LocationOn sx={{ mr: 1 }} />
          Venue Announcements
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<Add />}
          onClick={() => handleDialogOpen()}
        >
          Add New Venue
        </Button>
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      {isLoading && <CircularProgress sx={{ display: 'block', mx: 'auto', my: 3 }} />}
      
      {!isLoading && announcements.length === 0 && (
        <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
          No venue announcements found. Create one to let your students know where to meet.
        </Typography>
      )}
      
      {!isLoading && announcements.length > 0 && (
        <List>
          {announcements
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map((announcement) => (
            <ListItem key={announcement._id} divider>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {announcement.venue}
                    </Typography>
                    {announcement.active && (
                      <Box component="span" sx={{ ml: 1, px: 1, py: 0.5, bgcolor: 'success.light', borderRadius: 1, fontSize: '0.75rem', color: 'white' }}>
                        Active
                      </Box>
                    )}
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="body2">{announcement.message || 'No additional information'}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Posted: {new Date(announcement.date).toLocaleString()}
                    </Typography>
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                <Switch
                  edge="end"
                  checked={announcement.active}
                  onChange={() => handleToggleActive(announcement)}
                  inputProps={{ 'aria-labelledby': `switch-${announcement._id}` }}
                />
                <IconButton edge="end" onClick={() => handleDialogOpen(announcement)} sx={{ ml: 1 }}>
                  <Edit />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}
      
      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleDialogClose} fullWidth maxWidth="sm">
        <DialogTitle>
          {editingAnnouncement ? 'Edit Venue Announcement' : 'Add New Venue Announcement'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              name="venue"
              label="Venue Location*"
              fullWidth
              variant="outlined"
              value={formData.venue}
              onChange={handleInputChange}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              name="message"
              label="Additional Information (optional)"
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              value={formData.message}
              onChange={handleInputChange}
              sx={{ mb: 2 }}
            />
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ mr: 2 }}>Active:</Typography>
              <Switch
                name="active"
                checked={formData.active}
                onChange={handleInputChange}
                inputProps={{ 'aria-label': 'active' }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDialogClose} color="inherit">Cancel</Button>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Save'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      
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
    </Paper>
  );
};

export default TeacherClassVenue;
