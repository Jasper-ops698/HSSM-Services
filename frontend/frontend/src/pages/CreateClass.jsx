import React from 'react';
import { Box, Paper, Typography, Button, Alert } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const CreateClass = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Box sx={{ mb: 2, maxWidth: 600, mx: 'auto' }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/teacher-dashboard')}
          variant="outlined"
          sx={{ mb: 2 }}
        >
          Back to Dashboard
        </Button>
      </Box>

      <Paper sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
        <Typography variant="h4" gutterBottom>
          Class Management Update
        </Typography>
        <Alert severity="info" sx={{ mb: 2 }}>
          Teachers can no longer create or edit classes directly. All class setup and changes are handled by your HOD to keep department timetables consistent.
        </Alert>
        <Typography paragraph>
          If you need a new class created or an existing class updated, please contact your HOD with the details. Once they make the change, it will appear automatically in your dashboard.
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/manage-classes')}
        >
          View Assigned Classes
        </Button>
      </Paper>
    </Box>
  );
};

export default CreateClass;
