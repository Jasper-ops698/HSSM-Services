import React, { useEffect } from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import { AccountBalanceWallet, ArrowBack, ArrowForward } from '@mui/icons-material';
import CreditManager from '../components/CreditManager';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CreditControllerDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const sessionTimeout = setTimeout(() => {
      if (logout) logout();
      alert('Your session has expired. Please log in again.');
      navigate('/login');
    }, 15 * 60 * 1000);
    return () => clearTimeout(sessionTimeout);
  }, [logout, navigate]);

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Paper sx={{ p: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="outlined" startIcon={<ArrowBack />} sx={{ color: 'white', borderColor: 'white', '&:hover': { borderColor: '#e0e0e0', bgcolor: 'rgba(255,255,255,0.1)' } }} onClick={() => navigate(-1)}>
                Back
              </Button>
              <Button variant="outlined" startIcon={<ArrowForward />} sx={{ color: 'white', borderColor: 'white', '&:hover': { borderColor: '#e0e0e0', bgcolor: 'rgba(255,255,255,0.1)' } }} onClick={() => navigate(1)}>
                Forward
              </Button>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AccountBalanceWallet sx={{ mr: 2, fontSize: 40 }} />
              <Box>
                <Typography variant="h4" gutterBottom>
                  Credit Controller Dashboard
                </Typography>
                <Typography variant="body1">Manage student credits, view balances, and track transactions</Typography>
              </Box>
            </Box>
            <Box sx={{ width: 140 }} />
          </Box>
        </Paper>
      </Box>

      <CreditManager />
    </Box>
  );
};

export default CreditControllerDashboard;