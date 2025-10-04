import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Typography,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Paper,
  Divider,
  Chip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Add, Edit, Delete, Download } from '@mui/icons-material';
import dayjs from 'dayjs';

import { API_BASE_URL } from '../config';

const ReportCenter = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newReportData, setNewReportData] = useState({
    title: '',
    startDate: '',
    endDate: '',
  });

  const fetchReports = async () => {
    try {
      // Don't set loading to true on background refreshes
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/api/reports`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReports(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Polling mechanism for pending reports
  useEffect(() => {
    const reportsToPoll = reports.some(r => r.status === 'pending' || r.status === 'generating');
    
    if (!reportsToPoll) {
      return; // No need to poll
    }

    const interval = setInterval(() => {
      fetchReports();
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [reports]);


  const handleOpenDialog = () => setOpen(true);
  const handleCloseDialog = () => setOpen(false);

  const handleGenerateReport = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_BASE_URL}/api/reports/generate`, newReportData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Add the new pending report to the top of the list
      setReports(prevReports => [res.data, ...prevReports]);
      handleCloseDialog();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReport = async (id) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_BASE_URL}/api/reports/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchReports(); // Refresh the list
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete report.');
      }
    }
  };
  
  const handleDownload = async (id, title) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/api/reports/${id}/download`, {
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'blob', // Important for file downloads
        });
        
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${title.replace(/ /g, '_')}.pptx`);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);

    } catch (err) {
        setError(err.response?.data?.message || 'Failed to download report.');
    }
  };

  const getStatusChip = (status, errorMsg) => {
    switch (status) {
      case 'generating':
      case 'pending':
        return <Chip label="Generating..." color="warning" size="small" icon={<CircularProgress size={16} />} />;
      case 'completed':
        return <Chip label="Completed" color="success" size="small" />;
      case 'failed':
        return <Chip label="Failed" color="error" size="small" title={errorMsg || 'An unknown error occurred'} />;
      default:
        return null;
    }
  };


  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1">
            Report Center
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={handleOpenDialog}>
            Generate New Report
          </Button>
        </Box>
        <Divider sx={{ mb: 3 }} />

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {reports.length === 0 ? (
          <Typography>No reports found. Generate a new one to get started.</Typography>
        ) : (
          <List>
            {reports.map((report) => (
              <ListItem
                key={report._id}
                secondaryAction={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {getStatusChip(report.status, report.error)}
                    <IconButton 
                      edge="end" 
                      aria-label="edit" 
                      sx={{ ml: 1 }}
                      disabled={report.status !== 'completed'}
                      onClick={() => navigate(`/report-editor/${report._id}`)}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton 
                      edge="end" 
                      aria-label="download" 
                      sx={{ ml: 1 }} 
                      disabled={report.status !== 'completed'}
                      onClick={() => handleDownload(report._id, report.title)}
                    >
                      <Download />
                    </IconButton>
                    <IconButton 
                      edge="end" 
                      aria-label="delete" 
                      sx={{ ml: 1 }} 
                      onClick={() => handleDeleteReport(report._id)}
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                }
                disablePadding
              >
                <ListItemText
                  primary={report.title}
                  secondary={`Last updated: ${dayjs(report.updatedAt).format('MMM DD, YYYY h:mm A')}`}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Paper>

      {/* Dialog for New Report */}
      <Dialog open={open} onClose={handleCloseDialog}>
        <DialogTitle>Generate a New Report</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Report Title"
            type="text"
            fullWidth
            variant="standard"
            onChange={(e) => setNewReportData({ ...newReportData, title: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Start Date"
            type="date"
            fullWidth
            variant="standard"
            InputLabelProps={{ shrink: true }}
            onChange={(e) => setNewReportData({ ...newReportData, startDate: e.target.value })}
          />
          <TextField
            margin="dense"
            label="End Date"
            type="date"
            fullWidth
            variant="standard"
            InputLabelProps={{ shrink: true }}
            onChange={(e) => setNewReportData({ ...newReportData, endDate: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={isSubmitting}>Cancel</Button>
          <Button onClick={handleGenerateReport} disabled={isSubmitting}>
            {isSubmitting ? <CircularProgress size={24} /> : 'Generate'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ReportCenter;
