import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Box,
} from '@mui/material';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const AnnouncementForm = ({ open, onClose, onAnnouncementCreated }) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [targetRoles, setTargetRoles] = useState({
    student: true,
    teacher: true,
  });

  const handleRoleChange = (event) => {
    setTargetRoles({
      ...targetRoles,
      [event.target.name]: event.target.checked,
    });
  };

  const handleSubmit = async () => {
    // Client-side validation to avoid sending empty fields and triggering Mongoose validation
    if (!title || !message) {
      alert('Please provide both a title and a message for the announcement.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const selectedRoles = Object.keys(targetRoles).filter(
        (role) => targetRoles[role]
      );

      const res = await axios.post(
        `${API_BASE_URL}/api/announcements`,
        {
          title,
          message,
          targetRoles: selectedRoles,
          startDate: startDate || null,
          endDate: endDate || null,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Success path
      onAnnouncementCreated && onAnnouncementCreated(res.data);
      onClose && onClose(); // Close form on success
    } catch (error) {
      console.error('Failed to create announcement:', error);
      // Surface server validation error message if available
      const serverMessage = error.response?.data?.message;
      alert(serverMessage || 'Failed to create announcement. Please try again.');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Create Announcement</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Title"
          type="text"
          fullWidth
          variant="outlined"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <TextField
          margin="dense"
          label="Message"
          type="text"
          placeholder="Write the announcement message..."
          fullWidth
          multiline
          rows={4}
          variant="outlined"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <TextField
            margin="dense"
            label="Start Date"
            type="datetime-local"
            fullWidth
            variant="outlined"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{
              shrink: true,
            }}
          />
          <TextField
            margin="dense"
            label="End Date"
            type="datetime-local"
            fullWidth
            variant="outlined"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{
              shrink: true,
            }}
          />
        </Box>
        <FormGroup sx={{ mt: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={targetRoles.student}
                onChange={handleRoleChange}
                name="student"
              />
            }
            label="Students"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={targetRoles.teacher}
                onChange={handleRoleChange}
                name="teacher"
              />
            }
            label="Teachers"
          />
        </FormGroup>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">Create</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AnnouncementForm;
