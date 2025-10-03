import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import api from '../api';

const VenueManager = () => {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentVenue, setCurrentVenue] = useState({
    _id: null,
    name: '',
    location: '',
    capacity: '',
  });

  const fetchVenues = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/venues');
      setVenues(data);
    } catch (err) {
      setError('Failed to fetch venues.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVenues();
  }, []);

  const handleOpen = (venue = null) => {
    if (venue) {
      setIsEditing(true);
      setCurrentVenue(venue);
    } else {
      setIsEditing(false);
      setCurrentVenue({ _id: null, name: '', location: '', capacity: '' });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleChange = (e) => {
    setCurrentVenue({ ...currentVenue, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    const url = isEditing ? `/api/venues/${currentVenue._id}` : '/api/venues';
    const method = isEditing ? 'put' : 'post';

    try {
      await api[method](url, currentVenue);
      fetchVenues();
      handleClose();
    } catch (err) {
      setError(isEditing ? 'Failed to update venue.' : 'Failed to create venue.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this venue?')) {
      try {
        await api.delete(`/api/venues/${id}`);
        fetchVenues();
      } catch (err) {
        setError('Failed to delete venue.');
      }
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Venue Management
      </Typography>
      <Button
        startIcon={<Add />}
        variant="contained"
        onClick={() => handleOpen()}
        sx={{ mb: 2 }}
      >
        Add Venue
      </Button>
      {error && <Alert severity="error">{error}</Alert>}
      {loading ? (
        <CircularProgress />
      ) : (
        <List>
          {venues.map((venue) => (
            <ListItem
              key={venue._id}
              secondaryAction={
                <>
                  <IconButton edge="end" aria-label="edit" onClick={() => handleOpen(venue)}>
                    <Edit />
                  </IconButton>
                  <IconButton edge="end" aria-label="delete" onClick={() => handleDelete(venue._id)}>
                    <Delete />
                  </IconButton>
                </>
              }
            >
              <ListItemText
                primary={venue.name}
                secondary={`Location: ${venue.location} - Capacity: ${venue.capacity}`}
              />
            </ListItem>
          ))}
        </List>
      )}

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{isEditing ? 'Edit Venue' : 'Add New Venue'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Venue Name"
            type="text"
            fullWidth
            variant="standard"
            value={currentVenue.name}
            onChange={handleChange}
          />
          <TextField
            margin="dense"
            name="location"
            label="Location"
            type="text"
            fullWidth
            variant="standard"
            value={currentVenue.location}
            onChange={handleChange}
          />
          <TextField
            margin="dense"
            name="capacity"
            label="Capacity"
            type="number"
            fullWidth
            variant="standard"
            value={currentVenue.capacity}
            onChange={handleChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit}>{isEditing ? 'Save' : 'Add'}</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default VenueManager;
