import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';
import { API_URL } from '../config';
import { Visibility } from '@mui/icons-material';

const ClassManagement = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedClass, setSelectedClass] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/classes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClasses(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch classes. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleOpenView = (classItem) => {
    setSelectedClass(classItem);
    setViewOpen(true);
  };

  const handleCloseView = () => {
    setSelectedClass(null);
    setViewOpen(false);
  };

  const getPrimaryTimetable = (classItem) => {
    if (!classItem) return null;
    const tt = classItem.timetable;
    if (Array.isArray(tt) && tt.length > 0) return tt[0];
    return null;
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Class Management
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading ? (
        <CircularProgress />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Subject</TableCell>
                <TableCell>Teacher</TableCell>
                <TableCell>Day</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Venue</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {classes.map((classItem) => (
                <TableRow key={classItem._id}>
                  <TableCell>{classItem.name}</TableCell>
                  <TableCell>{classItem.teacher?.name || 'N/A'}</TableCell>
                  <TableCell>{getPrimaryTimetable(classItem)?.day || 'N/A'}</TableCell>
                  <TableCell>{(() => {
                    const p = getPrimaryTimetable(classItem);
                    return p ? `${p.startTime} - ${p.endTime}` : 'N/A';
                  })()}</TableCell>
                  <TableCell>{getPrimaryTimetable(classItem)?.venue || 'N/A'}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleOpenView(classItem)} color="primary" title="View">
                      <Visibility />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* View Dialog */}
      <Dialog open={viewOpen} onClose={handleCloseView} fullWidth maxWidth="sm">
        <DialogTitle>Class Details</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {selectedClass ? (
              <div>
                <p><strong>Name:</strong> {selectedClass.name}</p>
                <p><strong>Teacher:</strong> {selectedClass.teacher?.name || 'N/A'}</p>
                <div>
                  <strong>Timetable:</strong>
                  {Array.isArray(selectedClass.timetable) && selectedClass.timetable.length > 0 ? (
                    <ul>
                      {selectedClass.timetable.map((t, idx) => (
                        <li key={idx}>{t.day}: {t.startTime} - {t.endTime} @ {t.venue || 'N/A'}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>N/A</p>
                  )}
                </div>
                {selectedClass.description && <p><strong>Description:</strong> {selectedClass.description}</p>}
              </div>
            ) : (
              'No class selected.'
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseView}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ClassManagement;
