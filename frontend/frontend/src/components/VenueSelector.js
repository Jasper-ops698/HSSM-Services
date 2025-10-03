import React, { useState, useEffect, useCallback } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Box,
  Typography,
} from '@mui/material';
import api from '../api';

const VenueSelector = ({ open, onClose, timetableEntry, onVenueAssigned }) => {
  const [venues, setVenues] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchAvailableVenues = useCallback(async () => {
    if (!timetableEntry) return;

    setLoading(true);
    setError('');
    try {
      const { dayOfWeek, startTime, endTime, term, week } = timetableEntry;
      const response = await api.get('/api/venues/available', {
        params: { dayOfWeek, startTime, endTime, term, week },
      });
      setVenues(response.data);
    } catch (err) {
      setError('Failed to fetch available venues.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [timetableEntry]);

  useEffect(() => {
    if (open) {
      fetchAvailableVenues();
    }
  }, [open, fetchAvailableVenues]);

  const handleAssignVenue = async () => {
    if (!selectedVenue) {
      setError('Please select a venue.');
      return;
    }

    try {
      await onVenueAssigned(timetableEntry._id, selectedVenue);
      onClose();
    } catch (err) {
      setError('Failed to assign venue. It might have been booked by someone else.');
      console.error(err);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Assign Venue</DialogTitle>
      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={150}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <FormControl fullWidth margin="normal">
            <InputLabel id="venue-select-label">Venue</InputLabel>
            <Select
              labelId="venue-select-label"
              value={selectedVenue}
              onChange={(e) => setSelectedVenue(e.target.value)}
              label="Venue"
            >
              {venues.map((venue) => (
                <MenuItem key={venue._id} value={venue._id}>
                  {venue.name} {venue.capacity && `(Capacity: ${venue.capacity})`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleAssignVenue} variant="contained" disabled={loading || !selectedVenue}>
          Assign
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VenueSelector;
