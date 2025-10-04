import React, { useEffect, useCallback } from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const WaitingForRole = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const redirectToDashboard = useCallback((role) => {
    switch (role) {
      case 'admin':
        navigate('/admin');
        break;
      case 'HOD':
        navigate('/hod-dashboard');
        break;
      case 'teacher':
        navigate('/manage-classes');
        break;
      case 'student':
        navigate('/student-dashboard');
        break;
      case 'credit-controller':
        navigate('/credit-dashboard');
        break;
      case 'HSSM-provider':
        navigate('/hssm-dashboard');
        break;
      default:
        navigate('/dashboard');
    }
  }, [navigate]);

  useEffect(() => {
    // If user already has a role, redirect to appropriate dashboard
    if (user && user.role) {
      redirectToDashboard(user.role);
    }

    // Set up periodic check for role assignment
    const interval = setInterval(async () => {
      if (user) {
        await refreshUser();
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [user, refreshUser, redirectToDashboard]);

  const handleRefresh = async () => {
    await refreshUser();
  };

  return (
    <Box 
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f4f6f8'
      }}
    >
      <Paper 
        elevation={3}
        sx={{
          padding: 4,
          textAlign: 'center',
          maxWidth: '500px'
        }}
      >
        <Typography variant="h5" gutterBottom>
          Account Pending Approval
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Thank you for signing up. Your account is currently pending role assignment by an administrator. Please check back later.
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
          This page will automatically redirect you once your role is assigned.
        </Typography>
        <Button variant="outlined" onClick={handleRefresh}>
          Check Now
        </Button>
      </Paper>
    </Box>
  );
};

export default WaitingForRole;
