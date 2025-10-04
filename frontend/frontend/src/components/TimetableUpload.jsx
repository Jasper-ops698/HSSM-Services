import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import {
  UploadFile as UploadFileIcon,
  Delete as DeleteIcon,
  Preview as PreviewIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import api from '../api';

const steps = ['Select File', 'Preview & Validate', 'Confirm Upload'];

const TimetableUpload = ({ department }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ message: '', type: '' });
  const [previewData, setPreviewData] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [termStartDate, setTermStartDate] = useState('');
  const [termEndDate, setTermEndDate] = useState('');

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      // Basic validation for Excel files
      const allowedTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      if (allowedTypes.includes(selectedFile.type)) {
        setFile(selectedFile);
        setFeedback({ message: '', type: '' });
        setPreviewData(null);
        setActiveStep(0);
      } else {
        setFeedback({ message: 'Invalid file type. Please upload an Excel file (.xls, .xlsx).', type: 'error' });
      }
    }
  };

  const handlePreview = async () => {
    if (!file) {
      setFeedback({ message: 'Please select a file first.', type: 'warning' });
      return;
    }
    if (!department) {
      setFeedback({ message: 'Department information is missing.', type: 'error' });
      return;
    }

    setLoading(true);
    setFeedback({ message: '', type: '' });

    const formData = new FormData();
    formData.append('timetable', file);

    try {
      const response = await api.post('/api/timetable/preview', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Transform the backend response to match frontend expectations
      const transformedData = {
        ...response.data,
        data: []
      };

      // Flatten the preview data into a single array
      if (response.data.preview) {
        Object.entries(response.data.preview).forEach(([sheetName, sheetData]) => {
          const weekRangeStr = sheetData.weekRange ?
            `Weeks ${sheetData.weekRange.start}-${sheetData.weekRange.end}` :
            sheetName;

          sheetData.schedule.forEach((row, index) => {
            transformedData.data.push({
              sheetName,
              weekRange: weekRangeStr,
              rowNumber: index + 1,
              status: 'valid', // Default status
              errors: [],
              warnings: [],
              ...row
            });
          });
        });
      }

      setPreviewData(transformedData);
      setActiveStep(1);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to preview timetable.';
      setFeedback({ message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setFeedback({ message: 'Please select a file to upload.', type: 'warning' });
      return;
    }
    if (!department) {
      setFeedback({ message: 'Department information is missing. Cannot upload timetable.', type: 'error' });
      return;
    }

    setLoading(true);
    setFeedback({ message: '', type: '' });


    const formData = new FormData();
    formData.append('timetable', file);
    formData.append('department', department);
    if (termStartDate) {
      formData.append('termStartDate', termStartDate);
    }
    if (termEndDate) {
      formData.append('termEndDate', termEndDate);
    }

    try {
      await api.post('/api/timetable/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setFeedback({ message: 'Timetable uploaded and is being processed. Teachers and students will be notified upon completion.', type: 'success' });
      setFile(null);
      setPreviewData(null);
      setActiveStep(0);
      setConfirmDialogOpen(false);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to upload timetable.';
      setFeedback({ message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmUpload = () => {
    setConfirmDialogOpen(true);
  };

  const getStatusIcon = (status, errors) => {
    if (status === 'error' || errors.length > 0) {
      return <ErrorIcon color="error" />;
    }
    return <CheckCircleIcon color="success" />;
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
      <Typography variant="h6" gutterBottom>
        Upload Department Timetable
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Upload the termly timetable in Excel format (.xls, .xlsx). Preview and validate data before uploading.
      </Typography>
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          <strong>Excel File Structure Guide</strong>
        </Typography>
        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.875rem' }}>
          <li>Each sheet in your Excel file should represent a different weekly schedule.</li>
          <li>
            Name your sheets to define the weeks they apply to.
            Use formats like <strong>"Weeks 1-4"</strong> for a range or <strong>"Week 5"</strong> for a single week.
          </li>
          <li>
            Required columns are: <strong>subject, teacherEmail, dayOfWeek, startTime, endTime, venue</strong>.
          </li>
        </ul>
      </Alert>

  <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Step 1: File Selection */}
      {activeStep === 0 && (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadFileIcon />}
              disabled={loading}
            >
              Select File
              <input type="file" hidden onChange={handleFileChange} accept=".xls,.xlsx" />
            </Button>
            {file && (
              <Chip
                label={file.name}
                onDelete={() => {
                  setFile(null);
                  setPreviewData(null);
                  setActiveStep(0);
                }}
                deleteIcon={<DeleteIcon />}
                color="primary"
              />
            )}
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <label htmlFor="term-start-date" style={{ fontWeight: 500 }}>Term Start Date:</label>
              <input
                id="term-start-date"
                type="date"
                value={termStartDate}
                onChange={e => setTermStartDate(e.target.value)}
                disabled={loading}
                style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <label htmlFor="term-end-date" style={{ fontWeight: 500 }}>Term End Date:</label>
              <input
                id="term-end-date"
                type="date"
                value={termEndDate}
                onChange={e => setTermEndDate(e.target.value)}
                disabled={loading}
                style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </Box>
            <Typography variant="caption" color="text.secondary">
              <strong>Help:</strong> The Term Start and End Dates are used to calculate the week numbers for all timetable entries. Make sure these match the first and last weeks of your academic term.
            </Typography>
          </Box>
          <Button
            variant="contained"
            onClick={handlePreview}
            disabled={!file || loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PreviewIcon />}
          >
            {loading ? 'Processing...' : 'Preview & Validate'}
          </Button>
        </Box>
      )}

      {/* Step 2: Preview & Validation */}
      {activeStep === 1 && previewData && previewData.summary && (
        <Box>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="success.main">
                    {previewData.summary.validRows || 0}
                  </Typography>
                  <Typography variant="body2">Valid Rows</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="error.main">
                    {previewData.summary.errorRows || 0}
                  </Typography>
                  <Typography variant="body2">Error Rows</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="warning.main">
                    {previewData.summary.warningRows || 0}
                  </Typography>
                  <Typography variant="body2">Warning Rows</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6">
                    {previewData.summary.totalRows || 0}
                  </Typography>
                  <Typography variant="body2">Total Rows</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {previewData.errors && previewData.errors.length > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Errors Found:</Typography>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {previewData.errors.slice(0, 5).map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
                {previewData.errors.length > 5 && (
                  <li>... and {previewData.errors.length - 5} more errors</li>
                )}
              </ul>
            </Alert>
          )}

          {previewData.warnings && previewData.warnings.length > 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Warnings:</Typography>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {previewData.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </Alert>
          )}

          {previewData.data && previewData.data.length > 0 && (
          <TableContainer sx={{ mb: 2, maxHeight: 400 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Sheet</TableCell>
                  <TableCell>Weeks</TableCell>
                  <TableCell>Row</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Subject</TableCell>
                  <TableCell>Teacher</TableCell>
                  <TableCell>Day</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell>Venue</TableCell>
                  <TableCell>Issues</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {previewData.data.map((row, index) => (
                  <TableRow key={`${row.sheetName}-${row.rowNumber}-${index}`}>
                    <TableCell>{row.sheetName}</TableCell>
                    <TableCell>{row.weekRange}</TableCell>
                    <TableCell>{row.rowNumber}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {getStatusIcon(row.status, row.errors || [])}
                      </Box>
                    </TableCell>
                    <TableCell>{row.subject}</TableCell>
                    <TableCell>
                      {row.teacherName ? `${row.teacherName} (${row.teacherEmail})` : row.teacherEmail}
                    </TableCell>
                    <TableCell>{row.dayOfWeek}</TableCell>
                    <TableCell>{row.startTime} - {row.endTime}</TableCell>
                    <TableCell>{row.venue}</TableCell>
                    <TableCell>
                      {row.errors && row.errors.length > 0 && (
                        <Typography variant="body2" color="error.main">
                          {row.errors.join(', ')}
                        </Typography>
                      )}
                      {row.warnings && row.warnings.length > 0 && (
                        <Typography variant="body2" color="warning.main">
                          {row.warnings.join(', ')}
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          )}

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => setActiveStep(0)}
              disabled={loading}
            >
              Back
            </Button>
            <Button
              variant="contained"
              onClick={handleConfirmUpload}
              disabled={loading || previewData.summary.errorRows > 0}
              color={previewData.summary.errorRows > 0 ? 'warning' : 'primary'}
            >
              {previewData.summary.errorRows > 0 ? 'Upload with Errors' : 'Confirm Upload'}
            </Button>
          </Box>
        </Box>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>Confirm Timetable Upload</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Are you sure you want to upload this timetable?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This will replace any existing timetable entries for your department.
          </Typography>
          {previewData && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2">
                • Valid entries: {previewData.summary.validRows}
              </Typography>
              <Typography variant="body2">
                • Entries with errors: {previewData.summary.errorRows}
              </Typography>
              <Typography variant="body2">
                • Entries with warnings: {previewData.summary.warningRows}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {loading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>

      {feedback.message && (
        <Alert severity={feedback.type} sx={{ mt: 2 }}>
          {feedback.message}
        </Alert>
      )}
    </Paper>
  );
};

export default TimetableUpload;
