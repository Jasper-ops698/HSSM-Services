import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Card, CardContent, Button, Grid, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel, Box, Snackbar, Alert
} from '@mui/material';
import api from '../api';
const LOGO_COLOR = '#1976d2'; // Use your actual logo color

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const ClassTimetableManager = () => {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [timetable, setTimetable] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [entry, setEntry] = useState({ day: '', startTime: '', endTime: '', teacher: '' });
  const [feedback, setFeedback] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    fetchClasses();
    fetchTeachers();
  }, []);

  const fetchClasses = async () => {
  // setIsLoading(true); // Removed unused loading state
    try {
      const res = await api.get('/api/classes');
      setClasses(res.data);
    } catch (err) {
      setFeedback({ open: true, message: 'Failed to fetch classes.', severity: 'error' });
    } finally {
      // setIsLoading(false); // Removed unused loading state
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await api.get('/api/users', { params: { role: 'teacher' } });
      setTeachers(res.data);
    } catch (err) {
      setTeachers([]);
    }
  };

  const handleClassSelect = async (classId) => {
    setSelectedClass(classId);
  // setIsLoading(true); // Removed unused loading state
    try {
      const res = await api.get(`/api/classes/${classId}/timetable`);
      setTimetable(res.data.entries || []);
    } catch (err) {
      setTimetable([]);
    } finally {
      // setIsLoading(false); // Removed unused loading state
    }
  };

  const handleAddEntry = () => {
    setEntry({ day: '', startTime: '', endTime: '', teacher: '' });
    setModalOpen(true);
  };

  const handleSaveEntry = async () => {
    if (!selectedClass || !entry.day || !entry.startTime || !entry.endTime || !entry.teacher) return;
  // setIsLoading(true); // Removed unused loading state
    try {
      await api.post(`/api/classes/${selectedClass}/timetable`, entry);
      setFeedback({ open: true, message: 'Timetable entry added!', severity: 'success' });
      handleClassSelect(selectedClass);
    } catch (err) {
      setFeedback({ open: true, message: 'Failed to add entry.', severity: 'error' });
    } finally {
      // setIsLoading(false); // Removed unused loading state
      setModalOpen(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" align="center" gutterBottom sx={{ color: LOGO_COLOR, fontWeight: 'bold' }}>
        Class & Timetable Management
      </Typography>
      <Card sx={{ mb: 4, borderColor: LOGO_COLOR, borderWidth: 2, borderStyle: 'solid' }}>
        <CardContent>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="class-select-label">Select Class</InputLabel>
            <Select
              labelId="class-select-label"
              value={selectedClass}
              label="Select Class"
              onChange={e => handleClassSelect(e.target.value)}
              sx={{ bgcolor: '#f5f5f5' }}
            >
              <MenuItem value=""><em>Select a class...</em></MenuItem>
              {classes.map(cls => (
                <MenuItem key={cls._id} value={cls._id}>{cls.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box sx={{ mb: 2 }}>
            <Button variant="contained" color="primary" sx={{ bgcolor: LOGO_COLOR }} onClick={handleAddEntry} disabled={!selectedClass}>
              Add Timetable Entry
            </Button>
          </Box>
          <Grid container spacing={2}>
            {timetable.map((item, idx) => (
              <Grid item xs={12} sm={6} md={4} key={idx}>
                <Card sx={{ bgcolor: '#e3f2fd', borderColor: LOGO_COLOR, borderWidth: 1, borderStyle: 'solid' }}>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ color: LOGO_COLOR }}>{item.day}</Typography>
                    <Typography variant="body2">{item.startTime} - {item.endTime}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Teacher: {teachers.find(t => t._id === item.teacher)?.name || 'N/A'}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add Timetable Entry</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="day-select-label">Day</InputLabel>
            <Select
              labelId="day-select-label"
              value={entry.day}
              label="Day"
              onChange={e => setEntry({ ...entry, day: e.target.value })}
            >
              {daysOfWeek.map(day => (
                <MenuItem key={day} value={day}>{day}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Start Time"
            type="time"
            fullWidth
            value={entry.startTime}
            onChange={e => setEntry({ ...entry, startTime: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            label="End Time"
            type="time"
            fullWidth
            value={entry.endTime}
            onChange={e => setEntry({ ...entry, endTime: e.target.value })}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="teacher-select-label">Teacher</InputLabel>
            <Select
              labelId="teacher-select-label"
              value={entry.teacher}
              label="Teacher"
              onChange={e => setEntry({ ...entry, teacher: e.target.value })}
            >
              {teachers.map(teacher => (
                <MenuItem key={teacher._id} value={teacher._id}>{teacher.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)} color="secondary">Cancel</Button>
          <Button onClick={handleSaveEntry} variant="contained" color="primary" sx={{ bgcolor: LOGO_COLOR }}>Save</Button>
        </DialogActions>
      </Dialog>
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
    </Container>
  );
};

export default ClassTimetableManager;
